import { ListUsersAdminSummariesQuery } from './list-users-admin-summaries.query';
import { IUserRepository } from '../ports/user-repository.interface';
import { AppRoleCode } from '../../shared/rbac/app-role.code';

describe('ListUsersAdminSummariesQuery', () => {
  it('returns the summaries provided by the repository (passthrough)', async () => {
    const items = [
      {
        uid: 'u-1',
        username: 'alice',
        email: 'alice@example.com',
        roleCode: AppRoleCode.SUPER_ADMIN,
      },
      {
        uid: 'u-2',
        username: 'bob',
        email: null,
        roleCode: AppRoleCode.HUNTER,
      },
    ];
    const repository: jest.Mocked<IUserRepository> = {
      addUsername: jest.fn(),
      findById: jest.fn(),
      listAdminSummaries: jest.fn().mockResolvedValue(items),
    };
    const query = new ListUsersAdminSummariesQuery(repository);

    const result = await query.execute();

    expect(repository.listAdminSummaries).toHaveBeenCalledTimes(1);
    expect(result).toEqual(items);
  });

  it('returns an empty array when the repository has no users', async () => {
    const repository: jest.Mocked<IUserRepository> = {
      addUsername: jest.fn(),
      findById: jest.fn(),
      listAdminSummaries: jest.fn().mockResolvedValue([]),
    };
    const query = new ListUsersAdminSummariesQuery(repository);

    const result = await query.execute();

    expect(result).toEqual([]);
  });
});
