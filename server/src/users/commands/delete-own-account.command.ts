import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ProfileStepUpTokenService,
  STEP_UP_PURPOSE_ACCOUNT_DELETE,
} from '../../auth/application/profile-step-up-token.service';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import {
  I_USER_REPOSITORY,
  IUserRepository,
} from '../ports/user-repository.interface';

/**
 * Permanently deletes the authenticated user's own account (settings page).
 * Same DB cascade as admin deletion; blocks removal of the last super-admin.
 */
@Injectable()
export class DeleteOwnAccountCommand {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly stepUpTokens: ProfileStepUpTokenService,
  ) {}

  async execute(actor: Identity, stepUpToken: string): Promise<void> {
    const uid = actor.uid?.trim();
    if (!uid) {
      throw new NotFoundException('User not found');
    }
    const token = stepUpToken?.trim();
    if (!token) {
      throw new BadRequestException('Account deletion step-up token is required');
    }

    this.stepUpTokens.assertValid(token, uid, STEP_UP_PURPOSE_ACCOUNT_DELETE);

    const target = await this.userRepository.findSummaryById(uid);
    if (target === null) {
      throw new NotFoundException('User not found');
    }

    if (target.roleCode === AppRoleCode.SUPER_ADMIN) {
      const superAdmins = await this.userRepository.listSummariesByRoleCode(
        AppRoleCode.SUPER_ADMIN,
      );
      if (superAdmins.length <= 1) {
        throw new ConflictException(
          'Cannot delete the last super-admin account',
        );
      }
    }

    await this.userRepository.deleteCompletely(uid);
  }
}
