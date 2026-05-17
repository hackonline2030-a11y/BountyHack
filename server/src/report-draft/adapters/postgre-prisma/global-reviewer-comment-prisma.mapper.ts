import type { GlobalReviewerComment } from '../../../generated/prisma/client';
import type { GlobalReviewerCommentWire } from '../../models/global-submission-api.types';
import { ReportDraftEnumMapper } from './report-draft-enum.mapper';

const GENERAL_FIELD = '__general__';

export class GlobalReviewerCommentPrismaMapper {
  static toDomain(row: GlobalReviewerComment): GlobalReviewerCommentWire {
    return {
      id: row.id,
      globalSubmissionId: row.globalSubmissionId,
      authorId: row.authorId,
      authorRole: ReportDraftEnumMapper.reviewerRoleToWire(row.authorRole),
      anchor:
        row.anchor && typeof row.anchor === 'object' && 'field' in (row.anchor as object)
          ? { field: String((row.anchor as { field: string }).field) }
          : { field: GENERAL_FIELD },
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString(),
    };
  }

  static persistenceFromWire(wire: GlobalReviewerCommentWire) {
    return {
      id: wire.id,
      globalSubmissionId: wire.globalSubmissionId,
      authorId: wire.authorId,
      authorRole: ReportDraftEnumMapper.reviewerRoleFromWire(wire.authorRole),
      anchor: wire.anchor ?? { field: GENERAL_FIELD },
      body: wire.body,
      createdAt: new Date(wire.createdAt),
      resolvedAt: wire.resolvedAt ? new Date(wire.resolvedAt) : null,
    };
  }
}
