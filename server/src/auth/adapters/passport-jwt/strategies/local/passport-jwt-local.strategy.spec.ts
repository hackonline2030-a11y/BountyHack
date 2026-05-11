import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PassportJwtLocalStrategy } from './passport-jwt-local.strategy';
import { LoginWithPasswordCommand } from '../../../../application/commands/login-with-password.command';

const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.xcJlZ8F0eB_2oKeNlMJzr45UriVWk5hq80uOq2AMpcI';

describe('PassportJwtLocalStrategy', () => {
  let strategy: PassportJwtLocalStrategy;
  let loginWithPassword: jest.Mocked<Pick<LoginWithPasswordCommand, 'execute'>>;

  beforeEach(() => {
    loginWithPassword = {
      execute: jest.fn(),
    };
    strategy = new PassportJwtLocalStrategy(
      loginWithPassword as unknown as LoginWithPasswordCommand,
    );
  });

  it('normalizes email and delegates login to repository', async () => {
    const expected = {
      token: FAKE_JWT,
      user: {
        uid: 'uid-1',
        email: 'john@example.com',
        username: 'john',
      },
      require2FA: false,
    };
    loginWithPassword.execute.mockResolvedValue(expected);

    const req = { body: {} } as Request;
    const result = await strategy.validate(req, '  JOHN@EXAMPLE.COM  ', 'password123');

    expect(loginWithPassword.execute).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'password123',
    });
    expect(result).toEqual(expected);
  });

  it('throws UnauthorizedException when email is missing', async () => {
    await expect(strategy.validate({ body: {} } as Request, '', 'password123')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(loginWithPassword.execute).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when password is missing', async () => {
    await expect(
      strategy.validate({ body: {} } as Request, 'john@example.com', ''),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(loginWithPassword.execute).not.toHaveBeenCalled();
  });

  it('passes optional TOTP code from request body', async () => {
    const expected = {
      token: FAKE_JWT,
      user: { uid: 'uid-1', email: 'john@example.com', username: 'john' },
      require2FA: false,
    };
    loginWithPassword.execute.mockResolvedValue(expected);

    await strategy.validate(
      { body: { code: ' 123 456 ' } } as Request,
      'john@example.com',
      'password123',
    );

    expect(loginWithPassword.execute).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'password123',
      code: '123456',
    });
  });
});
