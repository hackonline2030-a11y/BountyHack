import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/** Brouillon sans équipe rapport — hunter toujours propriétaire. */
export type OrphanReportDraft = {
  id: string;
  hunterId: string;
  hunterDisplayName: string;
  aggregateStatus: ReportDraftDomainModel.AggregateStatus;
  reportTitle: string;
  createdAt: string;
  updatedAt: string;
};
