import { NotImplementedException } from '@nestjs/common';
import type { AuthenticatedSession } from '../models/authenticated-session';
import { AuthRepository } from '../../ports/auth.repository';
import { RefreshAccessTokenQuery } from './get-refresh-access-token.query';

describe('RefreshAccessTokenQuery', () => {
  it('delegates to AuthRepository.refreshAccessToken', async () => {
    const session: AuthenticatedSession = {
      token: 'new-access',
      user: {
        uid: 'uid-1',
        email: 'user@example.com',
        username: 'user',
      },
    };
    const authRepository = {
      getUserFromToken: jest.fn(),
      getUserByUid: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      refreshAccessToken: jest.fn().mockResolvedValue(session),
      logout: jest.fn(),
    };
    const query = new RefreshAccessTokenQuery(
      authRepository as unknown as AuthRepository,
    );

    const result = await query.execute('refresh-jwt-from-cookie');

    expect(authRepository.refreshAccessToken).toHaveBeenCalledWith(
      'refresh-jwt-from-cookie',
    );
    expect(result).toEqual(session);
  });

  it('propagates errors from AuthRepository (e.g. not implemented yet)', async () => {
    const authRepository = {
      getUserFromToken: jest.fn(),
      getUserByUid: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      refreshAccessToken: jest
        .fn()
        .mockRejectedValue(new NotImplementedException()),
      logout: jest.fn(),
    };
    const query = new RefreshAccessTokenQuery(
      authRepository as unknown as AuthRepository,
    );

    await expect(query.execute('x')).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });
});
