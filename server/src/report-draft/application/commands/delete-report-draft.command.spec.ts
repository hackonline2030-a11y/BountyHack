import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import type { Identity } from '../../../auth/domain/models/identity';
import { DeleteReportDraftCommand } from './delete-report-draft.command';

const superAdmin: Identity = {
  uid: 'sa-1',
  email: 'sa@test.com',
  roleCode: AppRoleCode.SUPER_ADMIN,
};

const coordinator: Identity = {
  uid: 'coord-1',
  email: 'coord@test.com',
  roleCode: AppRoleCode.COORDINATOR,
};

describe('DeleteReportDraftCommand', () => {
  const repository = {
    findById: jest.fn(),
    deleteById: jest.fn(),
  };

  const command = new DeleteReportDraftCommand(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes draft when super admin', async () => {
    repository.findById.mockResolvedValue({ id: 'draft-1' });
    repository.deleteById.mockResolvedValue(undefined);

    await command.execute(superAdmin, 'draft-1');

    expect(repository.deleteById).toHaveBeenCalledWith('draft-1');
  });

  it('throws when not super admin', async () => {
    await expect(command.execute(coordinator, 'draft-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.deleteById).not.toHaveBeenCalled();
  });

  it('throws when draft missing', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(command.execute(superAdmin, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.deleteById).not.toHaveBeenCalled();
  });
});
