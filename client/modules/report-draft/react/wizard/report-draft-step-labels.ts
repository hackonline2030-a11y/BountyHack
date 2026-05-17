import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

const Step = ReportDraftDomainModel.ReportDraftStep;

const LABELS_FR: Record<ReportDraftDomainModel.ReportDraftStep, string> = {
  [Step.META]: "Métadonnées",
  [Step.DESCRIPTION]: "Description",
  [Step.COLLECTION]: "Collecte",
  [Step.EXPLOITATION]: "Exploitation",
  [Step.PROOF_OF_CONCEPT]: "Preuve de concept",
  [Step.RISKS]: "Risques",
  [Step.REMEDIATION]: "Remédiation",
  [Step.FINAL]: "Finalisation",
};

const LABELS_EN: Record<ReportDraftDomainModel.ReportDraftStep, string> = {
  [Step.META]: "Metadata",
  [Step.DESCRIPTION]: "Description",
  [Step.COLLECTION]: "Collection",
  [Step.EXPLOITATION]: "Exploitation",
  [Step.PROOF_OF_CONCEPT]: "Proof of concept",
  [Step.RISKS]: "Risks",
  [Step.REMEDIATION]: "Remediation",
  [Step.FINAL]: "Finalization",
};

export function reportDraftStepLabel(
  step: ReportDraftDomainModel.ReportDraftStep,
  lng = "fr",
): string {
  return (lng.startsWith("en") ? LABELS_EN : LABELS_FR)[step];
}
