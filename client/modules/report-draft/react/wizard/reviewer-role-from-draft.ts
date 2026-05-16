import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";

/**
 * Reviewer role last assigned on this step (after a prior submit-for-review).
 * Used to pre-fill the hunter's reviewer dropdown when switching between parallel drafts.
 */
export function reviewerRoleFromDraftStep(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  step: ReportDraftDomainModel.ReportDraftStep,
): ReportDraftDomainModel.ReviewerRole | undefined {
  if (!draft) return undefined;
  const key = reportDraftStepToStateKey(step);
  const stepState = draft[key] as ReportDraftDomainModel.StepState<unknown>;
  return stepState.assignedReviewerRole ?? undefined;
}
