import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import type { IUserRepository } from '../ports/user-repository.interface';
import { DeleteOwnAccountCommand } from './delete-own-account.command';

describe('DeleteOwnAccountCommand', () => {
  const hunter: Identity = {
    uid: 'hunter-1',
    email: 'h@example.com',
    roleCode: AppRoleCode.HUNTER,
  };

  const repository: jest.Mocked<
    Pick<
      IUserRepository,
      'findSummaryById' | 'listSummariesByRoleCode' | 'deleteCompletely'
    >
  > = {
    findSummaryById: jest.fn(),
    listSummariesByRoleCode: jest.fn(),
    deleteCompletely: jest.fn(),
  };

  const command = new DeleteOwnAccountCommand(
    repository as unknown as IUserRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the authenticated user', async () => {
    repository.findSummaryById.mockResolvedValue({
      uid: hunter.uid,
      username: 'Junior',
      email: hunter.email ?? null,
      roleCode: AppRoleCode.HUNTER,
    });

    await command.execute(hunter);

    expect(repository.deleteCompletely).toHaveBeenCalledWith('hunter-1');
  });

  it('rejects when the user is the last super-admin', async () => {
    const soleAdmin: Identity = {
      uid: 'admin-1',
      email: 'a@example.com',
      roleCode: AppRoleCode.SUPER_ADMIN,
    };
    repository.findSummaryById.mockResolvedValue({
      uid: soleAdmin.uid,
      username: 'Lead',
      email: soleAdmin.email ?? null,
      roleCode: AppRoleCode.SUPER_ADMIN,
    });
    repository.listSummariesByRoleCode.mockResolvedValue([
      {
        uid: soleAdmin.uid,
        username: 'Lead',
        email: soleAdmin.email ?? null,
        roleCode: AppRoleCode.SUPER_ADMIN,
      },
    ]);

    await expect(command.execute(soleAdmin)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws when profile is missing', async () => {
    repository.findSummaryById.mockResolvedValue(null);

    await expect(command.execute(hunter)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
