import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DraftStep,
  ReportDraftAggregateStatus,
  StepStatus,
  SubmissionDecision,
} from '../../../generated/prisma/enums';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { IGlobalSubmissionRepository } from '../../ports/global-submission-repository.interface';
import type { GlobalSubmissionWire } from '../../models/global-submission-api.types';
import type { ReviewerRoleWire } from '../../models/report-draft-api.types';
import { REPORT_DRAFT_STEP_STATE_KEYS } from '../../models/report-draft-api.types';
import { ReportDraftEnumMapper } from './report-draft-enum.mapper';
import { GlobalSubmissionPrismaMapper } from './global-submission-prisma.mapper';

const STEP_BY_KEY: Record<(typeof REPORT_DRAFT_STEP_STATE_KEYS)[number], DraftStep> = {
  meta: DraftStep.META,
  description: DraftStep.DESCRIPTION,
  collection: DraftStep.COLLECTION,
  exploitation: DraftStep.EXPLOITATION,
  proofOfConcept: DraftStep.PROOF_OF_CONCEPT,
  risks: DraftStep.RISKS,
  remediation: DraftStep.REMEDIATION,
  final: DraftStep.FINAL,
};

@Injectable()
export class PrismaGlobalSubmissionRepository implements IGlobalSubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(globalSubmission: GlobalSubmissionWire): Promise<void> {
    const data = GlobalSubmissionPrismaMapper.persistenceFromWire(globalSubmission);
    await this.prisma.globalSubmission.upsert({
      where: { id: data.id },
      create: data,
      update: {
        payload: data.payload,
        submittedAt: data.submittedAt,
        submittedBy: data.submittedBy,
        reviewerRole: data.reviewerRole,
        decision: data.decision,
        decidedAt: data.decidedAt,
        decidedBy: data.decidedBy,
      },
    });
  }

  async submitForReview(globalSubmission: GlobalSubmissionWire): Promise<void> {
    const data = GlobalSubmissionPrismaMapper.persistenceFromWire(globalSubmission);
    const prismaReviewerRole = data.reviewerRole;

    await this.prisma.$transaction(async (tx) => {
      await tx.globalSubmission.create({ data });

      for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
        await tx.reportDraftStep.updateMany({
          where: {
            reportDraftId: data.reportDraftId,
            step: STEP_BY_KEY[key],
          },
          data: {
            status: StepStatus.AWAITING_GLOBAL_REVIEW,
            assignedReviewerRole: prismaReviewerRole,
          },
        });
      }

      await tx.reportDraft.update({
        where: { id: data.reportDraftId },
        data: { updatedAt: data.submittedAt },
      });
    });
  }

  async submitDualTracksForReview(input: {
    reportDraftId: string;
    revisionNumber: number;
    payload: GlobalSubmissionWire['payload'];
    submittedAt: string;
    submittedBy: string;
    qcId: string;
    superAdminId: string;
  }): Promise<GlobalSubmissionWire[]> {
    const submittedAt = new Date(input.submittedAt);
    const tracks: Array<{
      id: string;
      reviewerRole: ReviewerRoleWire;
    }> = [
      { id: input.qcId, reviewerRole: 'quality_checker' },
      { id: input.superAdminId, reviewerRole: 'super_admin' },
    ];

    return this.prisma.$transaction(async (tx) => {
      const results: GlobalSubmissionWire[] = [];

      for (const track of tracks) {
        const prismaRole = ReportDraftEnumMapper.reviewerRoleFromWire(track.reviewerRole);
        const existing = await tx.globalSubmission.findUnique({
          where: {
            reportDraftId_revisionNumber_reviewerRole: {
              reportDraftId: input.reportDraftId,
              revisionNumber: input.revisionNumber,
              reviewerRole: prismaRole,
            },
          },
        });

        if (existing) {
          throw new BadRequestException(
            'Global submission track already exists for this revision',
          );
        }

        const row = await tx.globalSubmission.create({
          data: {
            id: track.id,
            reportDraftId: input.reportDraftId,
            revisionNumber: input.revisionNumber,
            payload: input.payload as object,
            submittedAt,
            submittedBy: input.submittedBy,
            reviewerRole: prismaRole,
            decision: SubmissionDecision.PENDING,
          },
        });

        results.push(GlobalSubmissionPrismaMapper.toDomain(row));
      }

      for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
        await tx.reportDraftStep.updateMany({
          where: {
            reportDraftId: input.reportDraftId,
            step: STEP_BY_KEY[key],
          },
          data: {
            status: StepStatus.AWAITING_GLOBAL_REVIEW,
            assignedReviewerRole: null,
          },
        });
      }

      await tx.reportDraft.update({
        where: { id: input.reportDraftId },
        data: {
          aggregateStatus: ReportDraftAggregateStatus.UNDER_GLOBAL_REVIEW,
          superAdminGlobalRevisionCount: input.revisionNumber,
          updatedAt: submittedAt,
        },
      });

      return results;
    });
  }

  async recordDecision(input: {
    globalSubmissionId: string;
    decision: 'approve' | 'request-changes';
    decidedBy: string;
  }): Promise<void> {
    const row = await this.prisma.globalSubmission.findUnique({
      where: { id: input.globalSubmissionId },
    });
    if (row === null) {
      return;
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.globalSubmission.update({
        where: { id: input.globalSubmissionId },
        data: {
          decision:
            input.decision === 'approve'
              ? SubmissionDecision.APPROVE
              : SubmissionDecision.REQUEST_CHANGES,
          decidedAt: now,
          decidedBy: input.decidedBy,
        },
      });

      if (input.decision === 'approve') {
        await this.closeGlobalRevisionCycle(tx, row.reportDraftId, now);
      } else {
        await this.recomputeGlobalRevisionStepStatus(
          tx,
          row.reportDraftId,
          row.revisionNumber,
          now,
        );
      }
    });
  }

  private async closeGlobalRevisionCycle(
    tx: Prisma.TransactionClient,
    reportDraftId: string,
    now: Date,
  ): Promise<void> {
    const draft = await tx.reportDraft.findUnique({
      where: { id: reportDraftId },
      select: { superAdminGlobalRevisionCount: true },
    });
    const revisionNumber = draft?.superAdminGlobalRevisionCount ?? 0;

    if (revisionNumber > 0) {
      await tx.globalSubmission.updateMany({
        where: {
          reportDraftId,
          revisionNumber,
          decision: SubmissionDecision.PENDING,
        },
        data: {
          decision: SubmissionDecision.APPROVE,
          decidedAt: now,
        },
      });
    }

    for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
      await tx.reportDraftStep.updateMany({
        where: {
          reportDraftId,
          step: STEP_BY_KEY[key],
        },
        data: {
          status: StepStatus.APPROVED,
          assignedReviewerRole: null,
        },
      });
    }

    await tx.reportDraft.update({
      where: { id: reportDraftId },
      data: {
        aggregateStatus: ReportDraftAggregateStatus.READY_TO_PROGRAM,
        superAdminRevisionRequestedAt: null,
        updatedAt: now,
      },
    });
  }

  private async recomputeGlobalRevisionStepStatus(
    tx: Prisma.TransactionClient,
    reportDraftId: string,
    revisionNumber: number,
    now: Date,
  ): Promise<void> {
    const rows = await tx.globalSubmission.findMany({
      where: { reportDraftId, revisionNumber },
    });

    const hasRequestChanges = rows.some(
      (r) => r.decision === SubmissionDecision.REQUEST_CHANGES,
    );
    const hasApprove = rows.some((r) => r.decision === SubmissionDecision.APPROVE);
    const allPending =
      rows.length > 0 && rows.every((r) => r.decision === SubmissionDecision.PENDING);

    let stepStatus: StepStatus;
    if (hasRequestChanges) {
      stepStatus = StepStatus.NEEDS_GLOBAL_REVISION;
    } else if (hasApprove) {
      stepStatus = StepStatus.IN_GLOBAL_PROGRESS;
    } else if (allPending) {
      stepStatus = StepStatus.AWAITING_GLOBAL_REVIEW;
    } else {
      stepStatus = StepStatus.IN_GLOBAL_PROGRESS;
    }

    for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
      await tx.reportDraftStep.updateMany({
        where: {
          reportDraftId,
          step: STEP_BY_KEY[key],
        },
        data: {
          status: stepStatus,
          assignedReviewerRole: null,
        },
      });
    }

    await tx.reportDraft.update({
      where: { id: reportDraftId },
      data: {
        aggregateStatus: ReportDraftAggregateStatus.UNDER_GLOBAL_REVIEW,
        updatedAt: now,
      },
    });
  }

  async findById(id: string): Promise<GlobalSubmissionWire | null> {
    const row = await this.prisma.globalSubmission.findUnique({ where: { id } });
    return row ? GlobalSubmissionPrismaMapper.toDomain(row) : null;
  }

  async findByDraftId(draftId: string): Promise<GlobalSubmissionWire[]> {
    const rows = await this.prisma.globalSubmission.findMany({
      where: { reportDraftId: draftId },
      orderBy: { submittedAt: 'desc' },
    });
    return rows.map((row) => GlobalSubmissionPrismaMapper.toDomain(row));
  }

  async findPendingForReviewerRole(
    reviewerRole: ReviewerRoleWire,
  ): Promise<GlobalSubmissionWire[]> {
    const rows = await this.prisma.globalSubmission.findMany({
      where: {
        reviewerRole: ReportDraftEnumMapper.reviewerRoleFromWire(reviewerRole),
        decision: SubmissionDecision.PENDING,
      },
      orderBy: { submittedAt: 'desc' },
    });
    return rows.map((row) => GlobalSubmissionPrismaMapper.toDomain(row));
  }

  async findAllForReviewerRole(
    reviewerRole: ReviewerRoleWire,
  ): Promise<GlobalSubmissionWire[]> {
    const rows = await this.prisma.globalSubmission.findMany({
      where: {
        reviewerRole: ReportDraftEnumMapper.reviewerRoleFromWire(reviewerRole),
      },
      orderBy: { submittedAt: 'desc' },
    });
    return rows.map((row) => GlobalSubmissionPrismaMapper.toDomain(row));
  }
}
