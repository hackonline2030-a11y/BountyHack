import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DraftStep,
  ReportDraftAggregateStatus,
  ReportTeamJoinRequestStatus,
  StepStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { IReportTeamRepository } from '../../ports/report-team-repository.interface';
import type {
  CreateReportTeamInput,
  ReportTeamMemberRoleWire,
  ReportTeamMemberAssignmentWire,
  ReportTeamWire,
  UpdateReportTeamInput,
} from '../../models/report-team-api.types';
import { ReportTeamEnumMapper } from './report-team-enum.mapper';
import { ReportTeamPrismaMapper } from './report-team-prisma.mapper';

const teamInclude = {
  members: { include: { user: true } },
  reportDraft: { select: { aggregateStatus: true, hunterWriterId: true } },
} as const;

@Injectable()
export class PrismaReportTeamRepository implements IReportTeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ReportTeamWire | null> {
    const row = await this.prisma.reportTeam.findUnique({
      where: { id },
      include: teamInclude,
    });
    return row ? ReportTeamPrismaMapper.teamToWire(row) : null;
  }

  async findByReportDraftId(reportDraftId: string): Promise<ReportTeamWire | null> {
    const row = await this.prisma.reportTeam.findUnique({
      where: { reportDraftId },
      include: teamInclude,
    });
    return row ? ReportTeamPrismaMapper.teamToWire(row) : null;
  }

  async findAll(): Promise<ReportTeamWire[]> {
    const rows = await this.prisma.reportTeam.findMany({
      include: teamInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => ReportTeamPrismaMapper.teamToWire(row));
  }

  async findByMemberUserId(userId: string): Promise<ReportTeamWire[]> {
    const rows = await this.prisma.reportTeam.findMany({
      where: { members: { some: { userId } } },
      include: teamInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => ReportTeamPrismaMapper.teamToWire(row));
  }

  async isMemberOfDraft(userId: string, reportDraftId: string): Promise<boolean> {
    const count = await this.prisma.reportTeamMember.count({
      where: {
        userId,
        team: { reportDraftId },
      },
    });
    return count > 0;
  }

  async findDraftIdsForMember(userId: string): Promise<string[]> {
    const rows = await this.prisma.reportTeamMember.findMany({
      where: { userId },
      select: { team: { select: { reportDraftId: true } } },
    });
    return rows.map((row) => row.team.reportDraftId);
  }

  async findOrphanDraftOwnerId(reportDraftId: string): Promise<string | null> {
    const row = await this.prisma.reportDraft.findUnique({
      where: { id: reportDraftId },
      select: {
        hunterId: true,
        reportTeam: { select: { id: true } },
      },
    });
    if (row === null || row.reportTeam !== null) {
      return null;
    }
    return row.hunterId;
  }

  async findJoinableForUserId(userId: string): Promise<ReportTeamWire[]> {
    const rows = await this.prisma.reportTeam.findMany({
      where: {
        members: { none: { userId } },
        joinRequests: {
          none: {
            userId,
            status: ReportTeamJoinRequestStatus.PENDING,
          },
        },
      },
      include: teamInclude,
      orderBy: { label: 'asc' },
    });
    return rows.map((row) => ReportTeamPrismaMapper.teamToWire(row));
  }

  async create(input: CreateReportTeamInput): Promise<ReportTeamWire> {
    const existingDraftId = input.reportDraftId?.trim();
    if (existingDraftId) {
      return this.createForOrphanDraft(existingDraftId, input);
    }

    const hunters = input.members.filter((m) => m.role === 'hunter');
    const primaryHunterId = hunters[0]!.userId;
    const writerId =
      input.hunterWriterUserId?.trim() &&
      hunters.some((h) => h.userId === input.hunterWriterUserId.trim())
        ? input.hunterWriterUserId.trim()
        : primaryHunterId;
    const reportDraftId = randomUUID();
    const teamId = randomUUID();
    const now = new Date();
    const memberUserIds = input.members.map((m) => m.userId);

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.reportDraft.create({
        data: {
          id: reportDraftId,
          hunterId: primaryHunterId,
          hunterWriterId: writerId,
          version: 0,
          aggregateStatus: ReportDraftAggregateStatus.DRAFT,
          createdAt: now,
          updatedAt: now,
          steps: {
            create: [
              DraftStep.META,
              DraftStep.DESCRIPTION,
              DraftStep.COLLECTION,
              DraftStep.EXPLOITATION,
              DraftStep.PROOF_OF_CONCEPT,
              DraftStep.RISKS,
              DraftStep.REMEDIATION,
              DraftStep.FINAL,
            ].map((step) => ({
              id: randomUUID(),
              step,
              payload: {},
              status: StepStatus.IN_PROGRESS,
              currentRound: 0,
            })),
          },
        },
      });

      await tx.reportTeam.create({
        data: {
          id: teamId,
          reportDraftId,
          label: input.label.trim(),
        },
      });

      for (const member of input.members) {
        await tx.reportTeamMember.create({
          data: {
            id: randomUUID(),
            teamId,
            userId: member.userId,
            role: ReportTeamEnumMapper.memberRoleFromWire(member.role),
          },
        });
      }

      if (memberUserIds.length > 0) {
        await tx.reportTeamJoinRequest.updateMany({
          where: {
            userId: { in: memberUserIds },
            status: ReportTeamJoinRequestStatus.PENDING,
          },
          data: {
            status: ReportTeamJoinRequestStatus.APPROVED,
            decidedAt: new Date(),
          },
        });
      }

      return tx.reportTeam.findUniqueOrThrow({
        where: { id: teamId },
        include: teamInclude,
      });
    });

    return ReportTeamPrismaMapper.teamToWire(row);
  }

  private async createForOrphanDraft(
    reportDraftId: string,
    input: CreateReportTeamInput,
  ): Promise<ReportTeamWire> {
    const hunterId = await this.findOrphanDraftOwnerId(reportDraftId);
    if (hunterId === null) {
      throw new NotFoundException(
        'Orphan report draft not found or already has a team',
      );
    }

    const teamId = randomUUID();
    const memberUserIds = input.members.map((m) => m.userId);

    const row = await this.prisma.$transaction(async (tx) => {
      const draft = await tx.reportDraft.findUnique({
        where: { id: reportDraftId },
        select: { reportTeam: { select: { id: true } } },
      });
      if (draft === null || draft.reportTeam !== null) {
        throw new NotFoundException(
          'Orphan report draft not found or already has a team',
        );
      }

      await tx.reportTeam.create({
        data: {
          id: teamId,
          reportDraftId,
          label: input.label.trim(),
        },
      });

      await tx.reportTeamMember.create({
        data: {
          id: randomUUID(),
          teamId,
          userId: hunterId,
          role: ReportTeamEnumMapper.memberRoleFromWire('hunter'),
        },
      });

      for (const member of input.members) {
        await tx.reportTeamMember.create({
          data: {
            id: randomUUID(),
            teamId,
            userId: member.userId,
            role: ReportTeamEnumMapper.memberRoleFromWire(member.role),
          },
        });
      }

      const approveUserIds = [...memberUserIds];
      if (approveUserIds.length > 0) {
        await tx.reportTeamJoinRequest.updateMany({
          where: {
            userId: { in: approveUserIds },
            status: ReportTeamJoinRequestStatus.PENDING,
          },
          data: {
            status: ReportTeamJoinRequestStatus.APPROVED,
            decidedAt: new Date(),
          },
        });
      }

      return tx.reportTeam.findUniqueOrThrow({
        where: { id: teamId },
        include: teamInclude,
      });
    });

    return ReportTeamPrismaMapper.teamToWire(row);
  }

  async update(id: string, input: UpdateReportTeamInput): Promise<ReportTeamWire> {
    try {
      const row = await this.prisma.reportTeam.update({
        where: { id },
        data: { label: input.label.trim() },
        include: teamInclude,
      });
      return ReportTeamPrismaMapper.teamToWire(row);
    } catch {
      throw new NotFoundException('Report team not found');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.reportTeam.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Report team not found');
    }
  }

  async addMember(
    teamId: string,
    userId: string,
    role: ReportTeamMemberRoleWire,
  ): Promise<ReportTeamWire> {
    await this.prisma.reportTeamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: {
        id: randomUUID(),
        teamId,
        userId,
        role: ReportTeamEnumMapper.memberRoleFromWire(role),
      },
      update: {
        role: ReportTeamEnumMapper.memberRoleFromWire(role),
      },
    });
    const team = await this.findById(teamId);
    if (team === null) {
      throw new NotFoundException('Report team not found');
    }
    return team;
  }
}
