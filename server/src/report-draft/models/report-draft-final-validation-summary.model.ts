import type {
  AggregateStatusWire,
  ReportDraftStepStateKeyWire,
  StepStatusWire,
} from './report-draft-api.types';

/** Per-step workflow status for super-admin validation table rows. */
export type ReportDraftStepStatusesSummary = Record<
  ReportDraftStepStateKeyWire,
  StepStatusWire
>;

/**
 * Lightweight row for the super-admin final-validation queue.
 * Built from existing `ReportDraftWire` data — no extra persistence.
 */
export interface ReportDraftFinalValidationSummary {
  id: string;
  hunterId: string;
  aggregateStatus: AggregateStatusWire;
  reportTitle: string;
  teamLabel: string | null;
  stepStatuses: ReportDraftStepStatusesSummary;
  createdAt: string;
  updatedAt: string;
}
