import { UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from '../../ports/auth.repository';
import { GetUserFromTokenQuery } from './get-user-from-token.query';

describe('GetUserFromTokenQuery', () => {
  it('delegates to AuthRepository.getUserFromToken and returns Identity', async () => {
    const identity = { uid: 'uid-1', email: 'user@example.com' };
    const authRepository = {
      getUserFromToken: jest.fn().mockResolvedValue(identity),
      getUserByUid: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
    };
    const query = new GetUserFromTokenQuery(
      authRepository as unknown as AuthRepository,
    );

    const result = await query.execute('raw-bearer-token');

    expect(authRepository.getUserFromToken).toHaveBeenCalledWith(
      'raw-bearer-token',
    );
    expect(result).toEqual(identity);
  });

  it('propagates errors from AuthRepository', async () => {
    const authRepository = {
      getUserFromToken: jest
        .fn()
        .mockRejectedValue(new UnauthorizedException('Bad token')),
      getUserByUid: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
    };
    const query = new GetUserFromTokenQuery(
      authRepository as unknown as AuthRepository,
    );

    await expect(query.execute('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
