import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { isWizardStepEditableForDraft } from "@modules/report-draft/core/model/super-admin-final-validation";

/** Step can be edited with {@link saveStepPayload} / {@link updateStepPayload}. */
export function isWizardStepEditable(
  status: ReportDraftDomainModel.StepStatus,
  options?: {
    draft?: ReportDraftDomainModel.ReportDraft;
    globalSubmissions?: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>;
  },
): boolean {
  if (options?.draft !== undefined) {
    return isWizardStepEditableForDraft(
      options.draft,
      status,
      options.globalSubmissions ?? [],
    );
  }
  return status === "in-progress" || status === "needs-revision";
}
