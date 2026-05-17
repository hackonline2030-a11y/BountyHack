import type { GlobalSubmission } from '../../../generated/prisma/client';
import type {
  GlobalSubmissionDraftSnapshotWire,
  GlobalSubmissionWire,
} from '../../models/global-submission-api.types';
import { REPORT_DRAFT_STEP_STATE_KEYS } from '../../models/report-draft-api.types';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import { ReportDraftEnumMapper } from './report-draft-enum.mapper';

export class GlobalSubmissionPrismaMapper {
  static draftSnapshotFromWire(draft: ReportDraftWire): GlobalSubmissionDraftSnapshotWire {
    const snapshot = {} as GlobalSubmissionDraftSnapshotWire;
    for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
      snapshot[key] = draft[key];
    }
    return snapshot;
  }

  static toDomain(row: GlobalSubmission): GlobalSubmissionWire {
    return {
      id: row.id,
      reportDraftId: row.reportDraftId,
      revisionNumber: row.revisionNumber,
      payload: row.payload as unknown as GlobalSubmissionDraftSnapshotWire,
      submittedAt: row.submittedAt.toISOString(),
      submittedBy: row.submittedBy,
      reviewerRole: ReportDraftEnumMapper.reviewerRoleToWire(row.reviewerRole),
      decision: ReportDraftEnumMapper.decisionToWire(row.decision),
      decidedAt: row.decidedAt?.toISOString(),
      decidedBy: row.decidedBy ?? undefined,
    };
  }

  static persistenceFromWire(wire: GlobalSubmissionWire) {
    return {
      id: wire.id,
      reportDraftId: wire.reportDraftId,
      revisionNumber: wire.revisionNumber,
      payload: wire.payload as object,
      submittedAt: new Date(wire.submittedAt),
      submittedBy: wire.submittedBy,
      reviewerRole: ReportDraftEnumMapper.reviewerRoleFromWire(wire.reviewerRole),
      decision: ReportDraftEnumMapper.decisionFromWire(wire.decision),
      decidedAt: wire.decidedAt ? new Date(wire.decidedAt) : null,
      decidedBy: wire.decidedBy ?? null,
    };
  }
}
