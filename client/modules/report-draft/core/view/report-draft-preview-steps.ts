import { ReportDraftDomainModel as M } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import { LAST_HUNTER_WIZARD_STEP } from "@modules/report-draft/core/model/hunter-wizard-steps";

const FIRST_STEP = M.ReportDraftStep.META;

export const stepsUpTo = (
  currentStep: M.ReportDraftStep,
): M.ReportDraftStep[] => {
  const result: M.ReportDraftStep[] = [];
  for (let s = FIRST_STEP; s <= currentStep; s++) {
    result.push(s as M.ReportDraftStep);
  }
  return result;
};

export type StepPayloadResolver = (
  step: M.ReportDraftStep,
) => unknown;

/** Hunter workspace: draft payloads for each step up to the wizard cursor. */
export function payloadResolverFromDraft(
  draft: M.ReportDraft,
): StepPayloadResolver {
  return (step) => draft[reportDraftStepToStateKey(step)].payload;
}

/**
 * QC / mentor cumulative: approved steps from draft; current submission step
 * uses the submission snapshot.
 */
export function payloadResolverForReview(
  draft: M.ReportDraft,
  submissionStep: M.ReportDraftStep,
  submissionPayload: unknown,
): StepPayloadResolver {
  return (step) =>
    step === submissionStep ? submissionPayload : draft[reportDraftStepToStateKey(step)].payload;
}

/** Steps included in a cumulative review preview (META + approved + current). */
export function cumulativeStepsForReview(
  draft: M.ReportDraft,
  submissionStep: M.ReportDraftStep,
): M.ReportDraftStep[] {
  return stepsUpTo(submissionStep).filter((step) => {
    if (step === M.ReportDraftStep.META) return true;
    if (step === submissionStep) return true;
    const state = draft[reportDraftStepToStateKey(step)];
    return state.status === "approved";
  });
}

/** Hunter cumulative: META through current wizard step. */
export function cumulativeStepsForHunter(currentStep: M.ReportDraftStep): M.ReportDraftStep[] {
  return stepsUpTo(currentStep);
}

/**
 * Shared « aperçu général » (hunter Aperçu, super-admin validation) :
 * META through the furthest step with workflow activity on the draft.
 */
export function cumulativeStepsForGeneralReportPreview(
  draft: M.ReportDraft,
): M.ReportDraftStep[] {
  let furthest = M.ReportDraftStep.META;
  for (let s = M.ReportDraftStep.META; s <= LAST_HUNTER_WIZARD_STEP; s++) {
    const step = s as M.ReportDraftStep;
    const state = draft[reportDraftStepToStateKey(step)];
    if (step === M.ReportDraftStep.META) {
      furthest = step;
      continue;
    }
    if (state.status !== "in-progress" || state.currentRound > 0) {
      furthest = step;
    }
  }
  return stepsUpTo(furthest);
}
