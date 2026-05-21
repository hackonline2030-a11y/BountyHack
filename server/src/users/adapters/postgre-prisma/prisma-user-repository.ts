import { Injectable } from '@nestjs/common';
import { rm } from 'fs/promises';
import { IUserRepository } from '../../ports/user-repository.interface';
import { UserAdminSummary, UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import { resolveReportImageAssetPath } from '../../../report-draft/application/attachments/report-draft-image-storage';

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
      select: { id: true, username: true, twoFactorEnabled: true },
    });
    if (!row) {
      return null;
    }
    return {
      uid: row.id,
      username: row.username,
      twoFactorEnabled: row.twoFactorEnabled !== BigInt(0),
    };
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
    const storageKeys = await this.prisma.reportDraftAttachment.findMany({
      where: { reportDraftStep: { reportDraft: { hunterId: uid } } },
      select: { storageKey: true },
    });

    await this.prisma.$transaction(async (tx) => {
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

      await tx.user.delete({ where: { id: uid } });
    });

    await Promise.all(
      storageKeys.map((row) =>
        rm(resolveReportImageAssetPath(row.storageKey), { force: true }).catch(
          () => undefined,
        ),
      ),
    );
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
