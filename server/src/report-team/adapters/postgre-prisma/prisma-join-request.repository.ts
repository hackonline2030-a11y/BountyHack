import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ReportTeamJoinRequestStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { IJoinRequestRepository } from '../../ports/join-request-repository.interface';
import type {
  CreateEnrollmentRequestInput,
  CreateJoinRequestInput,
  ReportTeamJoinRequestWire,
} from '../../models/report-team-api.types';
import {
  parseAppRoleCodeFromRoleName,
  reportTeamRoleFromAppRoleCode,
} from '../../application/report-team-member-role-from-app-role';
import { ReportTeamEnumMapper } from './report-team-enum.mapper';
import { ReportTeamPrismaMapper } from './report-team-prisma.mapper';

const requestInclude = {
  team: true,
  user: true,
} as const;

@Injectable()
export class PrismaJoinRequestRepository implements IJoinRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ReportTeamJoinRequestWire | null> {
    const row = await this.prisma.reportTeamJoinRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
    return row ? ReportTeamPrismaMapper.joinRequestToWire(row) : null;
  }

  async findByUserId(userId: string): Promise<ReportTeamJoinRequestWire[]> {
    const rows = await this.prisma.reportTeamJoinRequest.findMany({
      where: { userId },
      include: requestInclude,
      orderBy: { requestedAt: 'desc' },
    });
    return rows.map((row) => ReportTeamPrismaMapper.joinRequestToWire(row));
  }

  async findPending(): Promise<ReportTeamJoinRequestWire[]> {
    const rows = await this.prisma.reportTeamJoinRequest.findMany({
      where: { status: ReportTeamJoinRequestStatus.PENDING },
      include: requestInclude,
      orderBy: { requestedAt: 'asc' },
    });
    return rows.map((row) => ReportTeamPrismaMapper.joinRequestToWire(row));
  }

  async create(
    userId: string,
    input: CreateJoinRequestInput,
  ): Promise<ReportTeamJoinRequestWire> {
    const team = await this.prisma.reportTeam.findUnique({
      where: { reportDraftId: input.reportDraftId },
    });
    if (team === null) {
      throw new NotFoundException(
        'No report team exists for this draft yet. Ask the coordinator to create one.',
      );
    }

    const existingPending = await this.prisma.reportTeamJoinRequest.findFirst({
      where: {
        teamId: team.id,
        userId,
        status: ReportTeamJoinRequestStatus.PENDING,
      },
    });
    if (existingPending !== null) {
      throw new BadRequestException(
        'A pending join request already exists for this team',
      );
    }

    const row = await this.prisma.reportTeamJoinRequest.create({
      data: {
        id: randomUUID(),
        teamId: team.id,
        userId,
        requestedRole: ReportTeamEnumMapper.memberRoleFromWire(
          input.requestedRole,
        ),
        message: input.message?.trim() || null,
      },
      include: requestInclude,
    });
    return ReportTeamPrismaMapper.joinRequestToWire(row);
  }

  async createEnrollment(
    userId: string,
    input: CreateEnrollmentRequestInput,
  ): Promise<ReportTeamJoinRequestWire> {
    const existingPending = await this.prisma.reportTeamJoinRequest.findFirst({
      where: {
        userId,
        teamId: null,
        status: ReportTeamJoinRequestStatus.PENDING,
      },
    });
    if (existingPending !== null) {
      throw new BadRequestException(
        'A pending enrollment request already exists',
      );
    }

    const row = await this.prisma.reportTeamJoinRequest.create({
      data: {
        id: randomUUID(),
        teamId: null,
        userId,
        requestedRole: ReportTeamEnumMapper.memberRoleFromWire(
          input.requestedRole,
        ),
        message: input.message?.trim() || null,
      },
      include: requestInclude,
    });
    return ReportTeamPrismaMapper.joinRequestToWire(row);
  }

  async approve(id: string, decidedById: string): Promise<ReportTeamJoinRequestWire> {
    return this.decide(id, decidedById, 'approve');
  }

  async reject(id: string, decidedById: string): Promise<ReportTeamJoinRequestWire> {
    return this.decide(id, decidedById, 'reject');
  }

  private async decide(
    id: string,
    decidedById: string,
    action: 'approve' | 'reject',
  ): Promise<ReportTeamJoinRequestWire> {
    const existing = await this.prisma.reportTeamJoinRequest.findUnique({
      where: { id },
    });
    if (existing === null) {
      throw new NotFoundException('Join request not found');
    }
    if (existing.status !== ReportTeamJoinRequestStatus.PENDING) {
      throw new BadRequestException('Join request is no longer pending');
    }

    const now = new Date();
    const row = await this.prisma.$transaction(async (tx) => {
      if (action === 'approve' && existing.teamId !== null) {
        const user = await tx.user.findUnique({
          where: { id: existing.userId },
          select: { role: { select: { name: true } } },
        });
        const roleCode = parseAppRoleCodeFromRoleName(user?.role?.name);
        const memberRole = ReportTeamEnumMapper.memberRoleFromWire(
          reportTeamRoleFromAppRoleCode(roleCode),
        );

        await tx.reportTeamMember.upsert({
          where: {
            teamId_userId: {
              teamId: existing.teamId,
              userId: existing.userId,
            },
          },
          create: {
            id: randomUUID(),
            teamId: existing.teamId,
            userId: existing.userId,
            role: memberRole,
          },
          update: { role: memberRole },
        });
      }

      return tx.reportTeamJoinRequest.update({
        where: { id },
        data: {
          status:
            action === 'approve'
              ? ReportTeamJoinRequestStatus.APPROVED
              : ReportTeamJoinRequestStatus.REJECTED,
          decidedAt: now,
          decidedById,
        },
        include: requestInclude,
      });
    });

    return ReportTeamPrismaMapper.joinRequestToWire(row);
  }
}
