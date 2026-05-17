import type { AggregateStatusWire } from './report-draft-api.types';

/**
 * Report draft with no `report_draft_teams` row (hunter link unchanged).
 * For coordinator / super-admin reassignment workflows.
 */
export interface ReportDraftOrphanSummary {
  id: string;
  hunterId: string;
  hunterDisplayName: string;
  aggregateStatus: AggregateStatusWire;
  reportTitle: string;
  createdAt: string;
  updatedAt: string;
}
