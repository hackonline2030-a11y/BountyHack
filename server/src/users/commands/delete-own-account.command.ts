import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import { IUserRepository } from '../ports/user-repository.interface';

/**
 * Permanently deletes the authenticated user's own account (settings page).
 * Same DB cascade as admin deletion; blocks removal of the last super-admin.
 */
@Injectable()
export class DeleteOwnAccountCommand {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(actor: Identity): Promise<void> {
    const uid = actor.uid?.trim();
    if (!uid) {
      throw new NotFoundException('User not found');
    }

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
