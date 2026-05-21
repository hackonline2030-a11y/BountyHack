import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { rm } from 'fs/promises';
import { hashPassword, verifyPassword } from '../../../auth/adapters/utils/password.util';
import type { Prisma } from '../../../generated/prisma/client';
import { ReportTeamMemberRole } from '../../../generated/prisma/enums';
import { IUserRepository } from '../../ports/user-repository.interface';
import { UserAdminSummary, UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
import type { UpdateOwnProfilePayload } from '../../payloads/update-own-profile.payload';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import { resolveReportImageAssetPath } from '../../../report-draft/application/attachments/report-draft-image-storage';
import { ReportTeamEnumMapper } from '../../../report-team/adapters/postgre-prisma/report-team-enum.mapper';
import { assertAtMostOneQualityChecker } from '../../../report-team/application/report-team-validity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addUsername(user: CreateUserProfilePayload): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.uid },
      create: { id: user.uid, username: user.username },
      update: { username: user.username },
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, twoFactorEnabled: true },
    });
    if (!row) {
      return null;
    }
    return {
      uid: row.id,
      username: row.username,
      email: row.email ?? null,
      twoFactorEnabled: row.twoFactorEnabled !== BigInt(0),
    };
  }

  async verifyPassword(uid: string, plainPassword: string): Promise<boolean> {
    const row = await this.prisma.user.findUnique({
      where: { id: uid },
      select: { passwordHash: true },
    });
    if (!row?.passwordHash) {
      return false;
    }
    return verifyPassword(plainPassword, row.passwordHash);
  }

  async updateOwnProfile(
    uid: string,
    patch: UpdateOwnProfilePayload,
  ): Promise<UserRecord> {
    const data: { username?: string; email?: string; passwordHash?: string } = {};
    if (patch.username !== undefined) {
      data.username = patch.username;
    }
    if (patch.email !== undefined) {
      const email = patch.email.trim().toLowerCase();
      const existing = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing && existing.id !== uid) {
        throw new ConflictException('Email is already in use');
      }
      data.email = email;
    }
    if (patch.newPassword !== undefined) {
      data.passwordHash = await hashPassword(patch.newPassword);
    }
    if (
      data.username === undefined &&
      data.email === undefined &&
      data.passwordHash === undefined
    ) {
      throw new BadRequestException('No profile fields to update');
    }
    try {
      const row = await this.prisma.user.update({
        where: { id: uid },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          twoFactorEnabled: true,
        },
      });
      return {
        uid: row.id,
        username: row.username,
        email: row.email ?? null,
        twoFactorEnabled: row.twoFactorEnabled !== BigInt(0),
      };
    } catch {
      throw new BadRequestException('Could not update profile');
    }
  }

  async findSummaryById(uid: string): Promise<UserAdminSummary | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        username: true,
        email: true,
        role: { select: { name: true } },
      },
    });
    if (row === null) {
      return null;
    }
    return {
      uid: row.id,
      username: row.username,
      email: row.email ?? null,
      roleCode: this.toAppRoleCode(row.role?.name ?? null),
    };
  }

  async listSummariesByRoleCode(roleCode: AppRoleCode): Promise<UserAdminSummary[]> {
    const rows = await this.prisma.user.findMany({
      where: { role: { name: roleCode } },
      select: {
        id: true,
        username: true,
        email: true,
        role: { select: { name: true } },
      },
      orderBy: { username: 'asc' },
    });
    return rows.map((row) => ({
      uid: row.id,
      username: row.username,
      email: row.email ?? null,
      roleCode: this.toAppRoleCode(row.role?.name ?? null),
    }));
  }

  async listAdminSummaries(): Promise<UserAdminSummary[]> {
    /**
     * Strictly selects the four fields needed by the admin table: any other column
     * (`passwordHash`, `twoFactorEnabled`, refresh-token relations, …) would be a
     * data-minimisation violation if the result ever leaks. The `role` relation is
     * joined here so the controller does not need a second round-trip per row.
     */
    const rows = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: { select: { name: true } },
      },
      orderBy: { username: 'asc' },
    });

    return rows.map((row) => ({
      uid: row.id,
      username: row.username,
      email: row.email ?? null,
      roleCode: this.toAppRoleCode(row.role?.name ?? null),
    }));
  }

  /**
   * Postgres `roles.name` is free-form text at the schema level; we only surface values
   * that the application explicitly recognises. Anything else is mapped to `null` so the
   * UI cannot accidentally render an unknown role label.
   */
  async deleteCompletely(uid: string): Promise<void> {
    const storageKeys = await this.prisma.$transaction(async (tx) => {
      const writerOnOthersDraft = await tx.reportDraft.findMany({
        where: {
          hunterWriterId: uid,
          hunterId: { not: uid },
        },
        select: { id: true, hunterId: true },
      });

      for (const draft of writerOnOthersDraft) {
        await tx.reportDraft.update({
          where: { id: draft.id },
          data: { hunterWriterId: draft.hunterId },
        });
      }

      await this.promotePrimaryHunterOnOwnedDraftsBeforeDelete(tx, uid);

      const keys = await tx.reportDraftAttachment.findMany({
        where: { reportDraftStep: { reportDraft: { hunterId: uid } } },
        select: { storageKey: true },
      });

      await tx.user.delete({ where: { id: uid } });
      return keys;
    });

    await Promise.all(
      storageKeys.map((row) =>
        rm(resolveReportImageAssetPath(row.storageKey), { force: true }).catch(
          () => undefined,
        ),
      ),
    );
  }

  /**
   * When the deleted user owns report draft(s), transfer `hunter_id` to the earliest
   * remaining squad hunter (by `joined_at`) so the team and draft survive. Drafts with
   * no other hunter on the team are left unchanged and cascade-delete with the user.
   */
  private async promotePrimaryHunterOnOwnedDraftsBeforeDelete(
    tx: Prisma.TransactionClient,
    uid: string,
  ): Promise<void> {
    const ownedDrafts = await tx.reportDraft.findMany({
      where: { hunterId: uid },
      select: {
        id: true,
        hunterWriterId: true,
        reportTeam: {
          select: {
            id: true,
            members: {
              where: {
                userId: { not: uid },
                role: ReportTeamMemberRole.HUNTER,
              },
              orderBy: { joinedAt: 'asc' },
              take: 1,
              select: { userId: true },
            },
          },
        },
      },
    });

    for (const draft of ownedDrafts) {
      const teamId = draft.reportTeam?.id;
      const nextHunterId = draft.reportTeam?.members[0]?.userId?.trim();
      if (!teamId || !nextHunterId) {
        continue;
      }

      const hunterUser = await tx.user.findUnique({
        where: { id: nextHunterId },
        select: { role: { select: { name: true } } },
      });
      if (hunterUser?.role?.name !== AppRoleCode.HUNTER) {
        continue;
      }

      const data: { hunterId: string; hunterWriterId?: string } = {
        hunterId: nextHunterId,
      };
      if (draft.hunterWriterId === uid) {
        data.hunterWriterId = nextHunterId;
      }

      await tx.reportDraft.update({
        where: { id: draft.id },
        data,
      });

      const currentMembers = await tx.reportTeamMember.findMany({
        where: { teamId },
        select: { userId: true, role: true },
      });
      const nextRoles = currentMembers
        .filter((m) => m.userId !== nextHunterId)
        .map((m) => ReportTeamEnumMapper.memberRoleToWire(m.role));
      nextRoles.push('hunter');
      assertAtMostOneQualityChecker(nextRoles);

      await tx.reportTeamMember.upsert({
        where: { teamId_userId: { teamId, userId: nextHunterId } },
        create: {
          id: randomUUID(),
          teamId,
          userId: nextHunterId,
          role: ReportTeamMemberRole.HUNTER,
        },
        update: { role: ReportTeamMemberRole.HUNTER },
      });
    }
  }

  private toAppRoleCode(name: string | null): AppRoleCode | null {
    if (!name) {
      return null;
    }
    return (Object.values(AppRoleCode) as string[]).includes(name)
      ? (name as AppRoleCode)
      : null;
  }
}
