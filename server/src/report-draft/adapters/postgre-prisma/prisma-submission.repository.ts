import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import type {
  ReviewerRoleWire,
  SubmissionWire,
} from '../../models/report-draft-api.types';
import { ReportDraftEnumMapper } from './report-draft-enum.mapper';
import {
  SubmissionPrismaMapper,
  type SubmissionWithSnapshots,
} from './submission-prisma.mapper';

const INCLUDE_SNAPSHOTS = { attachmentSnapshots: true } as const;

@Injectable()
export class PrismaSubmissionRepository implements ISubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(submission: SubmissionWire): Promise<void> {
    const draftStep = await this.prisma.reportDraftStep.findUnique({
      where: {
        reportDraftId_step: {
          reportDraftId: submission.reportDraftId,
          step: ReportDraftEnumMapper.draftStepFromStepNumber(submission.step),
        },
      },
    });
    if (!draftStep) {
      throw new NotFoundException(
        'Report draft step not found — save the draft before submitting',
      );
    }

    const data = SubmissionPrismaMapper.persistenceFromWire(
      submission,
      draftStep.id,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.submission.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          reportDraftStepId: data.reportDraftStepId,
          reportDraftId: data.reportDraftId,
          step: data.step,
          round: data.round,
          submissionKind: data.submissionKind,
          payload: data.payload,
          submittedAt: data.submittedAt,
          submittedBy: data.submittedBy,
          reviewerRole: data.reviewerRole,
          decision: data.decision,
          decidedAt: data.decidedAt,
          decidedBy: data.decidedBy,
        },
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

      await tx.submissionAttachmentSnapshot.deleteMany({
        where: { submissionId: data.id },
      });

      if (data.attachments.length > 0) {
        await tx.submissionAttachmentSnapshot.createMany({
          data: data.attachments.map((attachment) =>
            SubmissionPrismaMapper.attachmentSnapshotCreateInput(
              data.id,
              attachment,
            ),
          ),
        });
      }
    });
  }

  async findById(id: string): Promise<SubmissionWire | null> {
    const row = await this.prisma.submission.findUnique({
      where: { id },
      include: INCLUDE_SNAPSHOTS,
    });
    if (!row) {
      return null;
    }
    return SubmissionPrismaMapper.toDomain(row as SubmissionWithSnapshots);
  }

  async findByDraftId(draftId: string): Promise<SubmissionWire[]> {
    const rows = await this.prisma.submission.findMany({
      where: { reportDraftId: draftId },
      include: INCLUDE_SNAPSHOTS,
      orderBy: [{ round: 'asc' }, { step: 'asc' }],
    });
    return rows.map((row) =>
      SubmissionPrismaMapper.toDomain(row as SubmissionWithSnapshots),
    );
  }

  async findPendingForReviewerRole(
    reviewerRole: ReviewerRoleWire,
  ): Promise<SubmissionWire[]> {
    const prismaRole = ReportDraftEnumMapper.reviewerRoleFromWire(reviewerRole);
    const rows = await this.prisma.submission.findMany({
      where: {
        reviewerRole: prismaRole,
        decision: 'PENDING',
      },
      include: INCLUDE_SNAPSHOTS,
    });
    return rows
      .map((row) => SubmissionPrismaMapper.toDomain(row as SubmissionWithSnapshots))
      .sort((a, b) => sortSubmissionsNewestFirst(a, b));
  }

  async findAllForReviewerRole(
    reviewerRole: ReviewerRoleWire,
  ): Promise<SubmissionWire[]> {
    const prismaRole = ReportDraftEnumMapper.reviewerRoleFromWire(reviewerRole);
    const rows = await this.prisma.submission.findMany({
      where: { reviewerRole: prismaRole },
      include: INCLUDE_SNAPSHOTS,
    });
    return rows
      .map((row) => SubmissionPrismaMapper.toDomain(row as SubmissionWithSnapshots))
      .sort((a, b) => sortSubmissionsNewestFirst(a, b));
  }
}

function sortSubmissionsNewestFirst(a: SubmissionWire, b: SubmissionWire): number {
  if (a.submittedAt !== b.submittedAt) {
    return a.submittedAt < b.submittedAt ? 1 : -1;
  }
  if (a.reportDraftId !== b.reportDraftId) {
    return a.reportDraftId < b.reportDraftId ? -1 : 1;
  }
  if (a.step !== b.step) {
    return a.step - b.step;
  }
  return b.round - a.round;
}
