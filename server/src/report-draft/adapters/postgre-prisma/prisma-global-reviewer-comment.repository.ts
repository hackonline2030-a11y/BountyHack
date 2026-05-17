import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { IGlobalReviewerCommentRepository } from '../../ports/global-reviewer-comment-repository.interface';
import type { GlobalReviewerCommentWire } from '../../models/global-submission-api.types';
import { GlobalReviewerCommentPrismaMapper } from './global-reviewer-comment-prisma.mapper';

@Injectable()
export class PrismaGlobalReviewerCommentRepository implements IGlobalReviewerCommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveMany(comments: ReadonlyArray<GlobalReviewerCommentWire>): Promise<void> {
    if (comments.length === 0) return;
    await this.prisma.$transaction(async (tx) => {
      for (const comment of comments) {
        const data = GlobalReviewerCommentPrismaMapper.persistenceFromWire(comment);
        await tx.globalReviewerComment.create({ data });
      }
    });
  }

  async findByGlobalSubmissionId(
    globalSubmissionId: string,
  ): Promise<GlobalReviewerCommentWire[]> {
    const rows = await this.prisma.globalReviewerComment.findMany({
      where: { globalSubmissionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => GlobalReviewerCommentPrismaMapper.toDomain(row));
  }
}
