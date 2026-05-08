import { UnauthorizedException } from '@nestjs/common';
import { PassportJwtStrategy } from './passport-jwt.strategy';
import { GetUserByUidQuery } from '../application/queries/get-user-by-uid.query';

describe('PassportJwtStrategy', () => {
  let strategy: PassportJwtStrategy;
  let getUserByUidQuery: jest.Mocked<Pick<GetUserByUidQuery, 'execute'>>;
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'mon-lapin-caillousky-dans-la-serre';

    getUserByUidQuery = {
      execute: jest.fn(),
    };
    strategy = new PassportJwtStrategy(getUserByUidQuery as any);
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
    getUserByUidQuery.execute.mockResolvedValue(expectedUser);

    const result = await strategy.validate({
      uid: 'uid-123',
      email: 'john@example.com',
    });

    expect(getUserByUidQuery.execute).toHaveBeenCalledWith('uid-123');
    expect(result).toEqual(expectedUser);
  });

  it('falls back to user_id then sub', async () => {
    getUserByUidQuery.execute.mockResolvedValue({
      uid: 'user-id-value',
      email: 'john@example.com',
    });
    await strategy.validate({ user_id: 'user-id-value' });
    expect(getUserByUidQuery.execute).toHaveBeenCalledWith('user-id-value');

    getUserByUidQuery.execute.mockResolvedValue({
      uid: 'sub-value',
      email: 'john@example.com',
    });
    await strategy.validate({ sub: 'sub-value' });
    expect(getUserByUidQuery.execute).toHaveBeenCalledWith('sub-value');
  });

  it('throws UnauthorizedException when payload has no user identifier', async () => {
    await expect(strategy.validate({ email: 'john@example.com' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(getUserByUidQuery.execute).not.toHaveBeenCalled();
  });
});
