import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  REPORT_DRAFT_STEP_STATE_KEYS,
  type ReportDraftStepStateKey,
} from "@modules/report-draft/core/model/report-draft-step-keys";

const Step = ReportDraftDomainModel.ReportDraftStep;

/** Last step shown in the hunter wizard (FINAL is kept in DB only). */
export const LAST_HUNTER_WIZARD_STEP = Step.REMEDIATION;

export const HUNTER_WIZARD_STEP_COUNT = 7;

export const HUNTER_WIZARD_STEP_STATE_KEYS: ReadonlyArray<ReportDraftStepStateKey> =
  REPORT_DRAFT_STEP_STATE_KEYS.filter((key) => key !== "final");

export function isHunterWizardStep(step: ReportDraftDomainModel.ReportDraftStep): boolean {
  return step !== Step.FINAL;
}

/** Maps persisted wizard cursor away from removed FINAL step. */
export function clampHunterWizardStep(
  step: ReportDraftDomainModel.ReportDraftStep,
): ReportDraftDomainModel.ReportDraftStep {
  return step === Step.FINAL ? LAST_HUNTER_WIZARD_STEP : step;
}

export function hunterWizardStepsApproved(
  draft: ReportDraftDomainModel.ReportDraft,
): boolean {
  return HUNTER_WIZARD_STEP_STATE_KEYS.every((key) => draft[key].status === "approved");
}

export function applyReadyToProgramWhenWizardComplete(
  draft: ReportDraftDomainModel.ReportDraft,
): ReportDraftDomainModel.ReportDraft {
  if (!hunterWizardStepsApproved(draft)) {
    return draft;
  }
  return {
    ...draft,
    final: { ...draft.final, status: "approved" },
    aggregateStatus: "ready-to-program",
  };
}
