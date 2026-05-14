import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Keys on {@link ReportDraftDomainModel.ReportDraft} that hold a
 * {@link ReportDraftDomainModel.StepState} — one per wizard step enum value.
 */
export type ReportDraftStepStateKey =
  | "meta"
  | "description"
  | "collection"
  | "exploitation"
  | "proofOfConcept"
  | "risks"
  | "remediation"
  | "final";

export const REPORT_DRAFT_STEP_STATE_KEYS: ReadonlyArray<ReportDraftStepStateKey> = [
  "meta",
  "description",
  "collection",
  "exploitation",
  "proofOfConcept",
  "risks",
  "remediation",
  "final",
];

export function reportDraftStepToStateKey(
  step: ReportDraftDomainModel.ReportDraftStep,
): ReportDraftStepStateKey {
  const Step = ReportDraftDomainModel.ReportDraftStep;
  switch (step) {
    case Step.META:
      return "meta";
    case Step.DESCRIPTION:
      return "description";
    case Step.COLLECTION:
      return "collection";
    case Step.EXPLOITATION:
      return "exploitation";
    case Step.PROOF_OF_CONCEPT:
      return "proofOfConcept";
    case Step.RISKS:
      return "risks";
    case Step.REMEDIATION:
      return "remediation";
    case Step.FINAL:
      return "final";
  }
}
