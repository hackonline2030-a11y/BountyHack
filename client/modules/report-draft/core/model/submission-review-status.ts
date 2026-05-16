import { ReportDraftDomainModel } from "./report-draft.domain-model";

/** Anchor field id for QC/hunter free-form comments (not tied to a form field). */
export const GENERAL_REVIEW_COMMENT_FIELD = "__general__";

export function isGeneralReviewComment(
  comment: ReportDraftDomainModel.ReviewerComment,
): boolean {
  return (
    comment.anchor == null ||
    comment.anchor.field === "" ||
    comment.anchor.field === GENERAL_REVIEW_COMMENT_FIELD
  );
}

/**
 * Label for one row in the QC submissions table (one submission = one round).
 */
export function submissionRowStatusLabel(
  submission: ReportDraftDomainModel.Submission<unknown>,
  draft: ReportDraftDomainModel.ReportDraft | undefined,
): string {
  if (draft?.aggregateStatus === "rejected") {
    return "Rapport rejeté";
  }
  if (draft?.aggregateStatus === "given-up") {
    return "Rapport abandonné";
  }

  switch (submission.decision) {
    case "pending":
      return "En attente de revue";
    case "approve":
      return "Étape validée";
    case "endorse":
      return "Avis mentor favorable";
    case "request-changes":
      return submission.reviewerRole === "mentor"
        ? "Révisions demandées (mentor)"
        : "Révisions demandées";
    default:
      return submission.decision;
  }
}

export function submissionRowIsMentorPeer(
  submission: ReportDraftDomainModel.Submission<unknown>,
): boolean {
  return submission.reviewerRole === "mentor";
}

export function submissionRowIsActionable(
  submission: ReportDraftDomainModel.Submission<unknown>,
  draft: ReportDraftDomainModel.ReportDraft | undefined,
): boolean {
  if (draft?.aggregateStatus === "rejected" || draft?.aggregateStatus === "given-up") {
    return false;
  }
  return submission.decision === "pending";
}

/** Mentor/QC can still open decided mentor rows for consultation. */
export function submissionRowIsConsultable(
  submission: ReportDraftDomainModel.Submission<unknown>,
): boolean {
  return submission.decision !== "pending";
}
