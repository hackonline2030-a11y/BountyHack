import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportDraftAggregateStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftOrphanSummary } from '../../models/report-draft-orphan-summary.model';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import { toReportDraftOrphanSummary } from '../../application/mappers/report-draft-to-orphan-summary.mapper';
import { ReportTeamPrismaMapper } from '../../../report-team/adapters/postgre-prisma/report-team-prisma.mapper';
import {
  ReportDraftPrismaMapper,
  type ReportDraftWithSteps,
} from './report-draft-prisma.mapper';

const STEP_INCLUDE = {
  attachments: true,
} as const;

const TEAM_INCLUDE = {
  members: { include: { user: true } },
} as const;

@Injectable()
export class PrismaReportDraftRepository implements IReportDraftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(draft: ReportDraftWire): Promise<void> {
    const header = ReportDraftPrismaMapper.draftHeaderFromWire(draft);
    const stepRows = ReportDraftPrismaMapper.stepRowsFromWire(draft);

    await this.prisma.$transaction(async (tx) => {
      await tx.reportDraft.upsert({
        where: { id: header.id },
        create: {
          ...header,
          pendingReportId: null,
        },
        update: {
          hunterId: header.hunterId,
          version: header.version,
          aggregateStatus: header.aggregateStatus,
          updatedAt: header.updatedAt,
        },
      });

      for (const stepInput of stepRows) {
        const stepRow = await tx.reportDraftStep.upsert({
          where: {
            reportDraftId_step: {
              reportDraftId: header.id,
              step: stepInput.step,
            },
          },
          create: {
            reportDraftId: header.id,
            step: stepInput.step,
            payload: stepInput.payload,
            status: stepInput.status,
            currentRound: stepInput.currentRound,
            assignedReviewerRole: stepInput.assignedReviewerRole,
          },
          update: {
            payload: stepInput.payload,
            status: stepInput.status,
            currentRound: stepInput.currentRound,
            assignedReviewerRole: stepInput.assignedReviewerRole,
          },
        });

        await tx.reportDraftAttachment.deleteMany({
          where: { reportDraftStepId: stepRow.id },
        });

        if (stepInput.attachments.length > 0) {
          await tx.reportDraftAttachment.createMany({
            data: stepInput.attachments.map((attachment) =>
              ReportDraftPrismaMapper.attachmentCreateInput(stepRow.id, attachment),
            ),
          });
        }
      }
    });
  }

  async findById(id: string): Promise<ReportDraftWire | null> {
    const row = await this.prisma.reportDraft.findUnique({
      where: { id },
      include: {
        steps: {
          include: STEP_INCLUDE,
        },
        reportTeam: { include: TEAM_INCLUDE },
      },
    });
    if (!row) {
      return null;
    }
    return ReportDraftPrismaMapper.toDomain(row as ReportDraftWithSteps);
  }

  async findByHunterId(hunterId: string): Promise<ReportDraftWire[]> {
    const rows = await this.prisma.reportDraft.findMany({
      where: { hunterId },
      include: {
        steps: {
          include: STEP_INCLUDE,
        },
        reportTeam: { include: TEAM_INCLUDE },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) =>
      ReportDraftPrismaMapper.toDomain(row as ReportDraftWithSteps),
    );
  }

  async findAll(): Promise<ReportDraftWire[]> {
    const rows = await this.prisma.reportDraft.findMany({
      include: {
        steps: {
          include: STEP_INCLUDE,
        },
        reportTeam: { include: TEAM_INCLUDE },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) =>
      ReportDraftPrismaMapper.toDomain(row as ReportDraftWithSteps),
    );
  }

  async findPublished(): Promise<ReportDraftWire[]> {
    const rows = await this.prisma.reportDraft.findMany({
      where: {
        aggregateStatus: {
          in: [
            ReportDraftAggregateStatus.PUBLISHED,
            ReportDraftAggregateStatus.SUBMITTED_TO_PROGRAM,
          ],
        },
      },
      include: {
        steps: { include: STEP_INCLUDE },
        reportTeam: { include: TEAM_INCLUDE },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) =>
      ReportDraftPrismaMapper.toDomain(row as ReportDraftWithSteps),
    );
  }

  async findOrphanSummaries(): Promise<ReportDraftOrphanSummary[]> {
    const rows = await this.prisma.reportDraft.findMany({
      where: { reportTeam: null },
      include: {
        steps: {
          include: STEP_INCLUDE,
        },
        hunter: { select: { id: true, username: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => {
      const draft = ReportDraftPrismaMapper.toDomain(row as ReportDraftWithSteps);
      const hunterDisplayName = ReportTeamPrismaMapper.displayNameForUser(row.hunter);
      return toReportDraftOrphanSummary(draft, hunterDisplayName);
    });
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const draft = await tx.reportDraft.findUnique({
          where: { id },
          select: { pendingReportId: true },
        });
        if (draft === null) {
          throw new NotFoundException('Report draft not found');
        }

        const linkedReportIds = draft.pendingReportId
          ? [draft.pendingReportId]
          : [];

        await tx.report.deleteMany({
          where: {
            OR: [
              { sourceDraftId: id },
              ...(linkedReportIds.length > 0
                ? [{ id: { in: linkedReportIds } }]
                : []),
            ],
          },
        });

        await tx.reportDraft.delete({ where: { id } });
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Report draft not found');
    }
  }
}
