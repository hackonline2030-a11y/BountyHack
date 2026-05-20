import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ReportTeamJoinRequestStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { ILeaveRequestRepository } from '../../ports/leave-request-repository.interface';
import type {
  CreateLeaveRequestInput,
  ReportTeamLeaveRequestWire,
} from '../../models/report-team-api.types';
import { ReportTeamPrismaMapper } from './report-team-prisma.mapper';

const requestInclude = {
  team: true,
  user: true,
} as const;

@Injectable()
export class PrismaLeaveRequestRepository implements ILeaveRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ReportTeamLeaveRequestWire | null> {
    const row = await this.prisma.reportTeamLeaveRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
    return row ? ReportTeamPrismaMapper.leaveRequestToWire(row) : null;
  }

  async findByUserId(userId: string): Promise<ReportTeamLeaveRequestWire[]> {
    const rows = await this.prisma.reportTeamLeaveRequest.findMany({
      where: { userId },
      include: requestInclude,
      orderBy: { requestedAt: 'desc' },
    });
    return rows.map((row) => ReportTeamPrismaMapper.leaveRequestToWire(row));
  }

  async findPending(): Promise<ReportTeamLeaveRequestWire[]> {
    const rows = await this.prisma.reportTeamLeaveRequest.findMany({
      where: { status: ReportTeamJoinRequestStatus.PENDING },
      include: requestInclude,
      orderBy: { requestedAt: 'asc' },
    });
    return rows.map((row) => ReportTeamPrismaMapper.leaveRequestToWire(row));
  }

  async create(
    userId: string,
    input: CreateLeaveRequestInput,
  ): Promise<ReportTeamLeaveRequestWire> {
    const team = await this.prisma.reportTeam.findUnique({
      where: { id: input.teamId },
      include: {
        reportDraft: { select: { hunterId: true } },
        members: { select: { userId: true } },
      },
    });
    if (team === null) {
      throw new NotFoundException('Report team not found');
    }
    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new BadRequestException('You are not a member of this team');
    }
    if (team.reportDraft.hunterId !== userId) {
      throw new BadRequestException(
        'Only the primary report hunter can request coordinator removal',
      );
    }

    const existingPending = await this.prisma.reportTeamLeaveRequest.findFirst({
      where: {
        teamId: input.teamId,
        userId,
        status: ReportTeamJoinRequestStatus.PENDING,
      },
    });
    if (existingPending !== null) {
      throw new BadRequestException(
        'A pending leave request already exists for this team',
      );
    }

    const row = await this.prisma.reportTeamLeaveRequest.create({
      data: {
        id: randomUUID(),
        teamId: input.teamId,
        userId,
        message: input.message?.trim() || null,
      },
      include: requestInclude,
    });
    return ReportTeamPrismaMapper.leaveRequestToWire(row);
  }

  async approve(id: string, decidedById: string): Promise<ReportTeamLeaveRequestWire> {
    return this.decide(id, decidedById, 'approve');
  }

  async reject(id: string, decidedById: string): Promise<ReportTeamLeaveRequestWire> {
    return this.decide(id, decidedById, 'reject');
  }

  private async decide(
    id: string,
    decidedById: string,
    action: 'approve' | 'reject',
  ): Promise<ReportTeamLeaveRequestWire> {
    const existing = await this.prisma.reportTeamLeaveRequest.findUnique({
      where: { id },
    });
    if (existing === null) {
      throw new NotFoundException('Leave request not found');
    }
    if (existing.status !== ReportTeamJoinRequestStatus.PENDING) {
      throw new BadRequestException('Leave request is no longer pending');
    }

    const row = await this.prisma.reportTeamLeaveRequest.update({
      where: { id },
      data: {
        status:
          action === 'approve'
            ? ReportTeamJoinRequestStatus.APPROVED
            : ReportTeamJoinRequestStatus.REJECTED,
        decidedAt: new Date(),
        decidedById,
      },
      include: requestInclude,
    });
    return ReportTeamPrismaMapper.leaveRequestToWire(row);
  }
}
