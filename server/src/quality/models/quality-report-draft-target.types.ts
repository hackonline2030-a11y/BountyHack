import type { AggregateStatusWire } from '../../report-draft/models/report-draft-api.types';

/** Compact row for QC distribution picker (report target type). */
export type QualityReportDraftTargetWire = {
  id: string;
  reportTitle: string;
  teamLabel: string | null;
  aggregateStatus: AggregateStatusWire;
  updatedAt: string;
};
