import { Test, TestingModule } from '@nestjs/testing';
import { PassportJwtAuthController } from './passport-jwt-auth.controller';
import type { JwtLoginRequestDto, JwtRegisterRequestDto } from '../dto/jwt-auth.dto';
import type { Request } from 'express';
import { RegisterWithPasswordCommand } from '../application/commands/register-with-password.command';

const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.xcJlZ8F0eB_2oKeNlMJzr45UriVWk5hq80uOq2AMpcI';

describe('PassportJwtAuthController', () => {
  let controller: PassportJwtAuthController;
  let registerWithPassword: jest.Mocked<RegisterWithPasswordCommand>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PassportJwtAuthController],
      providers: [
        {
          provide: RegisterWithPasswordCommand,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PassportJwtAuthController);
    registerWithPassword = module.get(RegisterWithPasswordCommand);
  });

  it('delegates register to RegisterWithPasswordCommand with mapped payload', async () => {
    const payload: JwtRegisterRequestDto = {
      email: 'john@example.com',
      username: 'john',
      password: 'password123',
    };
    const expected = {
      token: FAKE_JWT,
      user: { uid: 'uid-1', email: payload.email, username: payload.username },
    };
    registerWithPassword.execute.mockResolvedValue(expected);

    const result = await controller.register(payload);

    expect(registerWithPassword.execute).toHaveBeenCalledWith({
      email: payload.email,
      username: payload.username,
      password: payload.password,
    });
    expect(result).toEqual(expected);
  });

  it('returns req.user for login endpoint (set by passport local guard)', () => {
    const req = {
      user: {
        token: FAKE_JWT,
        user: { uid: 'uid-1', email: 'john@example.com', username: 'john' },
      },
    } as Request & { user: unknown };

    const result = controller.login(req as any);
    expect(result).toEqual(req.user);
  });

  it('does not call register command from controller login', () => {
    const payload: JwtLoginRequestDto = {
      email: 'john@example.com',
      password: 'password123',
    };
    const req = { body: payload, user: { token: FAKE_JWT } } as Request & {
      user: unknown;
      body: JwtLoginRequestDto;
    };

    controller.login(req as any);

    expect(registerWithPassword.execute).not.toHaveBeenCalled();
  });
});
