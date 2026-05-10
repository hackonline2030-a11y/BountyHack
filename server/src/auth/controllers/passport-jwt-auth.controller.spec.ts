import { Test, TestingModule } from '@nestjs/testing';
import { PassportJwtAuthController } from './passport-jwt-auth.controller';
import type { JwtLoginRequestDto, JwtRegisterRequestDto } from '../dto/jwt-auth.dto';
import type { AuthenticatedSession } from '../application/models/authenticated-session';
import type { Request, Response } from 'express';
import { RegisterWithPasswordCommand } from '../application/commands/register-with-password.command';
import { RefreshAccessTokenQuery } from '../application/queries/get-refresh-access-token.query';
import { getJwtRefreshCookieName } from '../config/auth-env';

const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.xcJlZ8F0eB_2oKeNlMJzr45UriVWk5hq80uOq2AMpcI';

describe('PassportJwtAuthController', () => {
  let controller: PassportJwtAuthController;
  let registerWithPassword: jest.Mocked<RegisterWithPasswordCommand>;
  let refreshAccessToken: jest.Mocked<Pick<RefreshAccessTokenQuery, 'execute'>>;

  beforeEach(async () => {
    refreshAccessToken = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PassportJwtAuthController],
      providers: [
        {
          provide: RegisterWithPasswordCommand,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RefreshAccessTokenQuery,
          useValue: refreshAccessToken,
        },
      ],
    }).compile();

    controller = module.get(PassportJwtAuthController);
    registerWithPassword = module.get(RegisterWithPasswordCommand);
  });

  it('delegates register, sets refresh cookie, returns JSON without refresh field', async () => {
    const payload: JwtRegisterRequestDto = {
      email: 'john@example.com',
      username: 'john',
      password: 'password123',
    };
    const session = {
      token: FAKE_JWT,
      refreshToken: 'opaque-refresh',
      user: {
        uid: 'uid-1',
        email: payload.email,
        username: payload.username,
      },
      require2FA: false,
    };
    registerWithPassword.execute.mockResolvedValue(session);
    const res = { cookie: jest.fn() } as unknown as Response;

    const result = await controller.register(payload, res);

    expect(registerWithPassword.execute).toHaveBeenCalledWith({
      email: payload.email,
      username: payload.username,
      password: payload.password,
    });
    expect(res.cookie).toHaveBeenCalledWith(
      getJwtRefreshCookieName(),
      'opaque-refresh',
      expect.objectContaining({
        httpOnly: true,
        path: expect.stringContaining('/auth/refresh'),
      }),
    );
    expect(result).toEqual({
      token: FAKE_JWT,
      user: session.user,
      require2FA: false,
    });
  });

  it('login attaches refresh cookie and returns access-only body', () => {
    const session: AuthenticatedSession = {
      token: FAKE_JWT,
      refreshToken: 'opaque-r2',
      user: { uid: 'uid-1', email: 'john@example.com', username: 'john' },
      require2FA: false,
    };
    const req = { user: session } as Request & { user: AuthenticatedSession };
    const res = { cookie: jest.fn() } as unknown as Response;

    const result = controller.login(req, res);

    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({
      token: FAKE_JWT,
      user: session.user,
      require2FA: false,
    });
  });

  it('does not call register command from controller login', () => {
    const payload: JwtLoginRequestDto = {
      email: 'john@example.com',
      password: 'password123',
    };
    const req = {
      body: payload,
      user: {
        token: FAKE_JWT,
        user: { uid: 'uid-1', email: 'john@example.com', username: 'john' },
      },
    } as Request & {
      user: unknown;
      body: JwtLoginRequestDto;
    };
    const res = { cookie: jest.fn() } as unknown as Response;

    controller.login(req as never, res);

    expect(registerWithPassword.execute).not.toHaveBeenCalled();
  });

  it('refresh reads cookie name, rotates via query, returns access-only JSON', async () => {
    const newSession = {
      token: 'new-access-token',
      refreshToken: 'new-refresh',
      user: {
        uid: 'uid-1',
        email: 'john@example.com',
        username: 'john',
      },
      require2FA: false,
    };
    refreshAccessToken.execute.mockResolvedValue(newSession);
    const req = {
      cookies: { [getJwtRefreshCookieName()]: ' old-refresh ' },
    } as unknown as Request;
    const res = { cookie: jest.fn() } as unknown as Response;

    const result = await controller.refresh(req, res);

    expect(refreshAccessToken.execute).toHaveBeenCalledWith('old-refresh');
    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({
      token: 'new-access-token',
      user: newSession.user,
      require2FA: false,
    });
    expect(result).not.toHaveProperty('refreshToken');
  });
});
