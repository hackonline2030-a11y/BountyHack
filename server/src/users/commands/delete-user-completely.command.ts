import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import { IUserRepository } from '../ports/user-repository.interface';

/**
 * Permanently removes a user and dependent rows (Prisma cascades on owned
 * report drafts, team memberships, tokens, 2FA, …). Reassigns `hunter_writer_id`
 * to `hunter_id` on drafts the user only wrote for someone else so co-hunter
 * deletion does not wipe the whole report.
 */
@Injectable()
export class DeleteUserCompletelyCommand {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(actor: Identity, targetUserId: string): Promise<void> {
    if (actor.roleCode !== AppRoleCode.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin required');
    }

    const uid = targetUserId?.trim();
    if (!uid) {
      throw new NotFoundException('User not found');
    }

    if (actor.uid === uid) {
      throw new BadRequestException('You cannot delete your own account from this screen');
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
