import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { hasOpenSuperAdminRevisionCycle } from "@modules/report-draft/core/model/super-admin-final-validation";

export const MY_REPORTS_STEP_KEYS = [
  "meta",
  "description",
  "collection",
  "exploitation",
  "proofOfConcept",
  "risks",
  "remediation",
  "final",
] as const satisfies ReadonlyArray<keyof ReportDraftDomainModel.ReportDraft>;

export type MyReportsStepKey = (typeof MY_REPORTS_STEP_KEYS)[number];

const STEP_KEY_TO_ENUM: Record<MyReportsStepKey, ReportDraftDomainModel.ReportDraftStep> = {
  meta: ReportDraftDomainModel.ReportDraftStep.META,
  description: ReportDraftDomainModel.ReportDraftStep.DESCRIPTION,
  collection: ReportDraftDomainModel.ReportDraftStep.COLLECTION,
  exploitation: ReportDraftDomainModel.ReportDraftStep.EXPLOITATION,
  proofOfConcept: ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT,
  risks: ReportDraftDomainModel.ReportDraftStep.RISKS,
  remediation: ReportDraftDomainModel.ReportDraftStep.REMEDIATION,
  final: ReportDraftDomainModel.ReportDraftStep.FINAL,
};

/** QC approval preserved on the card while step rows are reset during global revision. */
export type MyReportsStepSegmentTone =
  | ReportDraftDomainModel.StepStatus
  | "qc-validated";

function stepWasQcApproved(
  draftId: string,
  step: ReportDraftDomainModel.ReportDraftStep,
  submissions: ReadonlyArray<ReportDraftDomainModel.Submission<unknown>>,
): boolean {
  return submissions.some(
    (s) =>
      s.reportDraftId === draftId &&
      s.step === step &&
      s.reviewerRole === "quality_checker" &&
      s.decision === "approve",
  );
}

export function resolveMyReportsStepSegmentTone(
  draft: ReportDraftDomainModel.ReportDraft,
  stepKey: MyReportsStepKey,
  submissions: ReadonlyArray<ReportDraftDomainModel.Submission<unknown>>,
): MyReportsStepSegmentTone {
  if (hasOpenSuperAdminRevisionCycle(draft)) {
    const step = STEP_KEY_TO_ENUM[stepKey];
    if (stepWasQcApproved(draft.id, step, submissions)) {
      return "qc-validated";
    }
  }
  return draft[stepKey].status;
}

export function countMyReportsValidatedSteps(
  draft: ReportDraftDomainModel.ReportDraft,
  submissions: ReadonlyArray<ReportDraftDomainModel.Submission<unknown>>,
): number {
  return MY_REPORTS_STEP_KEYS.reduce((n, key) => {
    const tone = resolveMyReportsStepSegmentTone(draft, key, submissions);
    return n + (tone === "approved" || tone === "qc-validated" ? 1 : 0);
  }, 0);
}

export function segmentToneClassName(tone: MyReportsStepSegmentTone): string {
  if (tone === "approved" || tone === "qc-validated") {
    return "bg-dashboard-accent";
  }
  if (tone === "awaiting-review" || tone === "awaiting-global-review") {
    return "bg-dashboard-accent/50";
  }
  if (tone === "needs-revision" || tone === "needs-global-revision") {
    return "bg-amber-400";
  }
  if (tone === "in-global-progress") {
    return "bg-violet-400/80";
  }
  return "bg-dashboard-accent-soft";
}

export function superAdminGlobalRevisionNumber(
  draft: ReportDraftDomainModel.ReportDraft,
): number {
  const n = draft.superAdminGlobalRevisionCount ?? 0;
  return n > 0 ? n : 1;
}
