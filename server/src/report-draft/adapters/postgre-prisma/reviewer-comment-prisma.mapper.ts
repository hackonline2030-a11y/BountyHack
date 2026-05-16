import { Prisma } from '../../../generated/prisma/client';
import type { ReviewerComment } from '../../../generated/prisma/client';
import type {
  ReviewerCommentAnchorWire,
  ReviewerCommentWire,
} from '../../models/report-draft-api.types';
import { ReportDraftEnumMapper } from './report-draft-enum.mapper';

export class ReviewerCommentPrismaMapper {
  static toDomain(row: ReviewerComment): ReviewerCommentWire {
    return {
      id: row.id,
      submissionId: row.submissionId,
      authorId: row.authorId,
      authorRole: ReportDraftEnumMapper.reviewerRoleToWire(row.authorRole),
      anchor: row.anchor
        ? (row.anchor as unknown as ReviewerCommentAnchorWire)
        : undefined,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString(),
    };
  }

  static persistenceFromWire(
    comment: ReviewerCommentWire,
  ): Prisma.ReviewerCommentUncheckedCreateInput {
    return {
      id: comment.id,
      submissionId: comment.submissionId,
      authorId: comment.authorId,
      authorRole: ReportDraftEnumMapper.reviewerRoleFromWire(comment.authorRole),
      anchor:
        comment.anchor != null
          ? (comment.anchor as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
      body: comment.body,
      createdAt: new Date(comment.createdAt),
      resolvedAt: comment.resolvedAt ? new Date(comment.resolvedAt) : null,
    };
  }
}
