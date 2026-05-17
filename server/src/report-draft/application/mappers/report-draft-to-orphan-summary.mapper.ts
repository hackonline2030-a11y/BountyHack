import type { ReportDraftOrphanSummary } from '../../models/report-draft-orphan-summary.model';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import { reportTitleFromMetaPayload } from './report-draft-to-final-validation-summary.mapper';

export function toReportDraftOrphanSummary(
  draft: ReportDraftWire,
  hunterDisplayName: string,
): ReportDraftOrphanSummary {
  return {
    id: draft.id,
    hunterId: draft.hunterId,
    hunterDisplayName,
    aggregateStatus: draft.aggregateStatus,
    reportTitle: reportTitleFromMetaPayload(draft.meta.payload),
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}
