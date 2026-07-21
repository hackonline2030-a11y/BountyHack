import { ListUsersDirectoryQuery } from './list-users-directory.query';
import type { IUserRepository } from '../ports/user-repository.interface';
import { AppRoleCode } from '../../shared/rbac/app-role.code';

describe('ListUsersDirectoryQuery', () => {
  it('maps admin summaries to public directory entries (no email / status)', async () => {
    const repository = {
      listAdminSummaries: jest.fn().mockResolvedValue([
        {
          uid: 'user-1',
          username: 'alice',
          email: 'alice@example.com',
          roleCode: AppRoleCode.HUNTER,
          accountStatus: 'valid',
          isFakeUser: false,
        },
      ]),
    } as unknown as IUserRepository;
    const query = new ListUsersDirectoryQuery(repository);

    const result = await query.execute();

    expect(result).toEqual([
      { uid: 'user-1', username: 'alice', roleCode: AppRoleCode.HUNTER },
    ]);
    // Ensure no sensitive fields leak through.
    expect(Object.keys(result[0])).toEqual(['uid', 'username', 'roleCode']);
  });
});
