import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/** Step can be edited with {@link saveStepPayload} / {@link updateStepPayload}. */
export function isWizardStepEditable(
  status: ReportDraftDomainModel.StepStatus,
): boolean {
  return status === "in-progress" || status === "needs-revision";
}
