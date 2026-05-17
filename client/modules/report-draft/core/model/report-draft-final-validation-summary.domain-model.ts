import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/** Row for super-admin final validation queue (mirrors Nest `ReportDraftFinalValidationSummary`). */
export type ReportDraftFinalValidationSummary = {
  id: string;
  hunterId: string;
  aggregateStatus: ReportDraftDomainModel.AggregateStatus;
  reportTitle: string;
  teamLabel: string | null;
  stepStatuses: Record<
    | "meta"
    | "description"
    | "collection"
    | "exploitation"
    | "proofOfConcept"
    | "risks"
    | "remediation"
    | "final",
    ReportDraftDomainModel.StepStatus
  >;
  createdAt: string;
  updatedAt: string;
};

export type ListReportDraftsForFinalValidationResult =
  | { ok: true; items: readonly ReportDraftFinalValidationSummary[] }
  | { ok: false; reason: "unauthorized" | "unreachable" | "malformed_payload" };
