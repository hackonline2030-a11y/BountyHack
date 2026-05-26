import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import type { IUserRepository } from '../ports/user-repository.interface';
import { DeleteUserCompletelyCommand } from './delete-user-completely.command';

describe('DeleteUserCompletelyCommand', () => {
  const superAdmin: Identity = {
    uid: 'admin-1',
    email: 'admin@example.com',
    roleCode: AppRoleCode.SUPER_ADMIN,
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

  const command = new DeleteUserCompletelyCommand(repository as IUserRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects non super-admin actors', async () => {
    await expect(
      command.execute(
        { ...superAdmin, roleCode: AppRoleCode.HUNTER },
        'target-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects self-delete', async () => {
    await expect(
      command.execute(superAdmin, superAdmin.uid),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deleting the last super-admin', async () => {
    repository.findSummaryById.mockResolvedValue({
      uid: 'sole-admin',
      username: 'Lead',
      email: 'lead@example.com',
      roleCode: AppRoleCode.SUPER_ADMIN,
      accountStatus: 'valid',
    });
    repository.listSummariesByRoleCode.mockResolvedValue([
      {
        uid: 'sole-admin',
        username: 'Lead',
        email: 'lead@example.com',
        roleCode: AppRoleCode.SUPER_ADMIN,
        accountStatus: 'valid',
      },
    ]);

    await expect(command.execute(superAdmin, 'sole-admin')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.deleteCompletely).not.toHaveBeenCalled();
  });

  it('deletes an existing hunter', async () => {
    repository.findSummaryById.mockResolvedValue({
      uid: 'hunter-1',
      username: 'Junior',
      email: 'junior@example.com',
      roleCode: AppRoleCode.HUNTER,
      accountStatus: 'valid',
    });

    await command.execute(superAdmin, 'hunter-1');

    expect(repository.deleteCompletely).toHaveBeenCalledWith('hunter-1');
  });

  it('throws when the user is missing', async () => {
    repository.findSummaryById.mockResolvedValue(null);

    await expect(command.execute(superAdmin, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
