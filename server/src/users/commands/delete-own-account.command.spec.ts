import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  ProfileStepUpTokenService,
  STEP_UP_PURPOSE_ACCOUNT_DELETE,
} from '../../auth/application/profile-step-up-token.service';
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

  const stepUpTokens: jest.Mocked<Pick<ProfileStepUpTokenService, 'assertValid'>> =
    {
      assertValid: jest.fn(),
    };

  const command = new DeleteOwnAccountCommand(
    repository as unknown as IUserRepository,
    stepUpTokens as unknown as ProfileStepUpTokenService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the authenticated user after step-up validation', async () => {
    repository.findSummaryById.mockResolvedValue({
      uid: hunter.uid,
      username: 'Junior',
      email: hunter.email ?? null,
      roleCode: AppRoleCode.HUNTER,
    });

    await command.execute(hunter, 'delete-token');

    expect(stepUpTokens.assertValid).toHaveBeenCalledWith(
      'delete-token',
      'hunter-1',
      STEP_UP_PURPOSE_ACCOUNT_DELETE,
    );
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

    await expect(command.execute(soleAdmin, 'delete-token')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws when profile is missing', async () => {
    repository.findSummaryById.mockResolvedValue(null);

    await expect(command.execute(hunter, 'delete-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
