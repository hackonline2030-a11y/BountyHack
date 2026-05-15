import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { IReviewerCommentRepository } from '../../ports/reviewer-comment-repository.interface';
import type { ReviewerCommentWire } from '../../models/report-draft-api.types';
import { ReviewerCommentPrismaMapper } from './reviewer-comment-prisma.mapper';
import { ReportDraftEnumMapper } from './report-draft-enum.mapper';
import type { SubmissionStepWire } from '../../models/report-draft-api.types';

@Injectable()
export class PrismaReviewerCommentRepository implements IReviewerCommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveMany(comments: ReadonlyArray<ReviewerCommentWire>): Promise<void> {
    if (comments.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const comment of comments) {
        const data = ReviewerCommentPrismaMapper.persistenceFromWire(comment);
        await tx.reviewerComment.upsert({
          where: { id: data.id },
          create: data,
          update: {
            anchor: data.anchor,
            body: data.body,
            resolvedAt: data.resolvedAt,
          } satisfies Prisma.ReviewerCommentUncheckedUpdateInput,
        });
      }
    });
  }

  async findBySubmissionId(submissionId: string): Promise<ReviewerCommentWire[]> {
    const rows = await this.prisma.reviewerComment.findMany({
      where: { submissionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ReviewerCommentPrismaMapper.toDomain(row));
  }

  async findByReportDraftStep(
    reportDraftId: string,
    step: number,
  ): Promise<ReviewerCommentWire[]> {
    const draftStep = await this.prisma.reportDraftStep.findFirst({
      where: {
        reportDraftId,
        step: ReportDraftEnumMapper.draftStepFromStepNumber(step as SubmissionStepWire),
      },
      select: { id: true },
    });
    if (draftStep === null) {
      return [];
    }

    const rows = await this.prisma.reviewerComment.findMany({
      where: {
        submission: { reportDraftStepId: draftStep.id },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ReviewerCommentPrismaMapper.toDomain(row));
  }
}
