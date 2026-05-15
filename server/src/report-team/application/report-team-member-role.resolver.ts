import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import type { Identity } from '../../auth/domain/models/identity';
import type {
  ReportTeamMemberAssignmentWire,
  ReportTeamMemberRoleWire,
} from '../models/report-team-api.types';
import {
  parseAppRoleCodeFromRoleName,
  reportTeamRoleFromAppRoleCode,
  reportTeamRoleFromIdentity,
} from './report-team-member-role-from-app-role';

@Injectable()
export class ReportTeamMemberRoleResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFromIdentity(
    identity: Identity,
  ): Promise<ReportTeamMemberRoleWire> {
    if (identity.roleCode) {
      return reportTeamRoleFromIdentity(identity);
    }
    return this.resolveForUserId(identity.uid);
  }

  async resolveForUserId(userId: string): Promise<ReportTeamMemberRoleWire> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: { select: { name: true } } },
    });
    if (row === null) {
      throw new NotFoundException(`User not found: ${userId}`);
    }
    const roleCode = parseAppRoleCodeFromRoleName(row.role?.name);
    return reportTeamRoleFromAppRoleCode(roleCode);
  }

  /**
   * Builds team member assignments from user ids only.
   * Ignores any role sent by the client; roles always come from Postgres `users.role`.
   */
  async resolveMemberAssignments(
    assignments: ReadonlyArray<ReportTeamMemberAssignmentWire>,
  ): Promise<ReportTeamMemberAssignmentWire[]> {
    const userIds = [...new Set(assignments.map((m) => m.userId))];
    if (userIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: { select: { name: true } } },
    });

    const roleByUserId = new Map<string, ReportTeamMemberRoleWire>();
    for (const row of rows) {
      const roleCode = parseAppRoleCodeFromRoleName(row.role?.name);
      roleByUserId.set(row.id, reportTeamRoleFromAppRoleCode(roleCode));
    }

    const resolved: ReportTeamMemberAssignmentWire[] = [];
    for (const assignment of assignments) {
      const canonicalRole = roleByUserId.get(assignment.userId);
      if (canonicalRole === undefined) {
        throw new NotFoundException(`User not found: ${assignment.userId}`);
      }
      if (assignment.role !== canonicalRole) {
        throw new BadRequestException(
          `Role for user ${assignment.userId} must match account role (${canonicalRole})`,
        );
      }
      resolved.push({ userId: assignment.userId, role: canonicalRole });
    }
    return resolved;
  }
}
