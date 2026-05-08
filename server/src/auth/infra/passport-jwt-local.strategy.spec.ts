import { UnauthorizedException } from '@nestjs/common';
import { PassportJwtLocalStrategy } from './passport-jwt-local.strategy';
import type { AuthRepository } from '../ports/auth.repository';

const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.xcJlZ8F0eB_2oKeNlMJzr45UriVWk5hq80uOq2AMpcI';

describe('PassportJwtLocalStrategy', () => {
  let strategy: PassportJwtLocalStrategy;
  let authRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    authRepository = {
      register: jest.fn(),
      login: jest.fn(),
      getUserFromToken: jest.fn(),
      getUserByUid: jest.fn(),
      logout: jest.fn(),
    };
    strategy = new PassportJwtLocalStrategy(authRepository);
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
    authRepository.login.mockResolvedValue(expected);

    const result = await strategy.validate('  JOHN@EXAMPLE.COM  ', 'password123');

    expect(authRepository.login).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'password123',
    });
    expect(result).toEqual(expected);
  });

  it('throws UnauthorizedException when email is missing', async () => {
    await expect(strategy.validate('', 'password123')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(authRepository.login).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when password is missing', async () => {
    await expect(
      strategy.validate('john@example.com', ''),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authRepository.login).not.toHaveBeenCalled();
  });
});
