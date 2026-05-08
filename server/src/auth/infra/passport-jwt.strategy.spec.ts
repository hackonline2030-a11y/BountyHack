import { UnauthorizedException } from '@nestjs/common';
import { PassportJwtStrategy } from './passport-jwt.strategy';
import type { AuthRepository } from '../ports/auth.repository';

describe('PassportJwtStrategy', () => {
  let strategy: PassportJwtStrategy;
  let authRepository: jest.Mocked<AuthRepository>;
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'mon-lapin-caillousky-dans-la-serre';

    authRepository = {
      register: jest.fn(),
      login: jest.fn(),
      getUserFromToken: jest.fn(),
      getUserByUid: jest.fn(),
      logout: jest.fn(),
    };
    strategy = new PassportJwtStrategy(authRepository);
  });

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('uses uid when present in payload', async () => {
    const expectedUser = { uid: 'uid-123', email: 'john@example.com' };
    authRepository.getUserByUid.mockResolvedValue(expectedUser);

    const result = await strategy.validate({
      uid: 'uid-123',
      email: 'john@example.com',
    });

    expect(authRepository.getUserByUid).toHaveBeenCalledWith('uid-123');
    expect(result).toEqual(expectedUser);
  });

  it('falls back to user_id then sub', async () => {
    authRepository.getUserByUid.mockResolvedValue({
      uid: 'user-id-value',
      email: 'john@example.com',
    });
    await strategy.validate({ user_id: 'user-id-value' });
    expect(authRepository.getUserByUid).toHaveBeenCalledWith('user-id-value');

    authRepository.getUserByUid.mockResolvedValue({
      uid: 'sub-value',
      email: 'john@example.com',
    });
    await strategy.validate({ sub: 'sub-value' });
    expect(authRepository.getUserByUid).toHaveBeenCalledWith('sub-value');
  });

  it('throws UnauthorizedException when payload has no user identifier', async () => {
    await expect(strategy.validate({ email: 'john@example.com' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(authRepository.getUserByUid).not.toHaveBeenCalled();
  });
});
