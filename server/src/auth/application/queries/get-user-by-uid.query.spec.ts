import { NotFoundException } from '@nestjs/common';
import { AuthRepository } from '../../ports/auth.repository';
import { GetUserByUidQuery } from './get-user-by-uid.query';

describe('GetUserByUidQuery', () => {
  it('delegates to AuthRepository.getUserByUid and returns Identity', async () => {
    const identity = { uid: 'uid-1', email: 'user@example.com' };
    const authRepository = {
      getUserFromToken: jest.fn(),
      getUserByUid: jest.fn().mockResolvedValue(identity),
      register: jest.fn(),
      login: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
    };
    const query = new GetUserByUidQuery(
      authRepository as unknown as AuthRepository,
    );

    const result = await query.execute('uid-1');

    expect(authRepository.getUserByUid).toHaveBeenCalledWith('uid-1');
    expect(result).toEqual(identity);
  });

  it('propagates errors from AuthRepository', async () => {
    const authRepository = {
      getUserFromToken: jest.fn(),
      getUserByUid: jest
        .fn()
        .mockRejectedValue(new NotFoundException('User not found')),
      register: jest.fn(),
      login: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
    };
    const query = new GetUserByUidQuery(
      authRepository as unknown as AuthRepository,
    );

    await expect(query.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
