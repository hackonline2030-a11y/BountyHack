import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export const GLOBAL_STEP_STATUSES = [
  "in-global-progress",
  "needs-global-revision",
  "awaiting-global-review",
] as const satisfies ReadonlyArray<ReportDraftDomainModel.StepStatus>;

export type GlobalStepStatus = (typeof GLOBAL_STEP_STATUSES)[number];

export function isGlobalStepStatus(
  status: ReportDraftDomainModel.StepStatus,
): status is GlobalStepStatus {
  return (GLOBAL_STEP_STATUSES as readonly string[]).includes(status);
}

export function isGlobalStepEditable(
  status: ReportDraftDomainModel.StepStatus,
): boolean {
  return status === "in-global-progress" || status === "needs-global-revision";
}

export function isGlobalStepEligibleForSubmit(
  status: ReportDraftDomainModel.StepStatus,
): boolean {
  return isGlobalStepEditable(status);
}
