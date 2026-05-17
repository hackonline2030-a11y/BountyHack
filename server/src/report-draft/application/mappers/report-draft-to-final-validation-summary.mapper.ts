import type { ReportDraftFinalValidationSummary } from '../../models/report-draft-final-validation-summary.model';
import type {
  ReportDraftWire,
  ReportDraftStepStateKeyWire,
} from '../../models/report-draft-api.types';
import { REPORT_DRAFT_STEP_STATE_KEYS } from '../../models/report-draft-api.types';

export function reportTitleFromMetaPayload(payload: Record<string, unknown>): string {
  const title = payload['reportTitle'];
  if (typeof title === 'string' && title.trim() !== '') {
    return title.trim();
  }
  return '';
}

export function toReportDraftFinalValidationSummary(
  draft: ReportDraftWire,
): ReportDraftFinalValidationSummary {
  const stepStatuses = {} as ReportDraftFinalValidationSummary['stepStatuses'];
  for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
    stepStatuses[key as ReportDraftStepStateKeyWire] = draft[key].status;
  }

  return {
    id: draft.id,
    hunterId: draft.hunterId,
    aggregateStatus: draft.aggregateStatus,
    reportTitle: reportTitleFromMetaPayload(draft.meta.payload),
    teamLabel: draft.reportTeam?.label?.trim() || null,
    stepStatuses,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}
