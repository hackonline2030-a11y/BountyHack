import type { ReportDraftWire } from '../../models/report-draft-api.types';
import { REPORT_DRAFT_STEP_STATE_KEYS } from '../../models/report-draft-api.types';

/** Snapshot persisted on `reports.frozen_content` when a draft is submitted to the program. */
export function buildFrozenContentFromDraft(
  draft: ReportDraftWire,
  frozenAt: Date,
): Record<string, unknown> {
  const steps: Record<string, unknown> = {};
  for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
    steps[key] = draft[key];
  }
  return {
    schemaVersion: 1,
    sourceDraftId: draft.id,
    draftVersion: draft.version,
    hunterId: draft.hunterId,
    steps,
    reportTeam: draft.reportTeam ?? null,
    frozenAt: frozenAt.toISOString(),
  };
}
