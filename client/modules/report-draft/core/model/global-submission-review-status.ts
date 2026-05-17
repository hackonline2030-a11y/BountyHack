import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { canDecideOnGlobalSubmission } from "@modules/report-draft/core/model/super-admin-final-validation";

export function globalSubmissionRowStatusLabel(
  submission: ReportDraftDomainModel.GlobalSubmission,
  draft: ReportDraftDomainModel.ReportDraft | undefined,
): string {
  if (draft?.aggregateStatus === "rejected") return "Rapport rejeté";
  if (draft?.aggregateStatus === "given-up") return "Rapport abandonné";

  switch (submission.decision) {
    case "pending":
      return "En attente de revue globale";
    case "approve":
      return "Brouillon validé (global)";
    case "request-changes":
      return "Révisions globales demandées";
    case "endorse":
      return "Avis mentor favorable";
    default:
      return submission.decision;
  }
}

export function globalSubmissionRowIsActionable(
  submission: ReportDraftDomainModel.GlobalSubmission,
  draft: ReportDraftDomainModel.ReportDraft | undefined,
): boolean {
  if (draft?.aggregateStatus === "rejected" || draft?.aggregateStatus === "given-up") {
    return false;
  }
  return canDecideOnGlobalSubmission(draft, submission);
}
