import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { REPORT_DRAFT_STEP_STATE_KEYS } from "@modules/report-draft/core/model/report-draft-step-keys";
import {
  isGlobalStepEditable,
  isGlobalStepEligibleForSubmit,
  isGlobalStepStatus,
} from "@modules/report-draft/core/model/global-step-status";
import { GENERAL_REVIEW_COMMENT_FIELD } from "@modules/report-draft/core/model/submission-review-status";
import {
  canHunterResubmitGlobalRevision,
  findPendingGlobalSubmissionForRole,
  globalSubmissionsForCurrentRevision,
  hasGlobalRevisionApproval,
  hasGlobalRevisionChangeRequests,
  isAwaitingInitialGlobalReviewerDecisions,
  isHunterBlockedByPendingGlobalReview,
} from "@modules/report-draft/core/model/global-submission-revision";

/** Draft is in an open super-admin revision cycle (not yet submitted to program). */
export function hasOpenSuperAdminRevisionCycle(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
): boolean {
  return (
    Boolean(draft?.superAdminRevisionRequestedAt?.trim()) &&
    draft?.aggregateStatus !== "submitted-to-program"
  );
}

/** Super-admin global revision in progress — team may edit all steps freely. */
export function isSuperAdminGlobalRevisionMode(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
): boolean {
  return (
    draft?.aggregateStatus === "under-global-review" &&
    Boolean(draft.superAdminRevisionRequestedAt?.trim())
  );
}

export function findPendingGlobalSubmission(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
  reviewerRole?: ReportDraftDomainModel.ReviewerRole,
): ReportDraftDomainModel.GlobalSubmission | undefined {
  if (reviewerRole) {
    return findPendingGlobalSubmissionForRole(draft, globalSubmissions, reviewerRole);
  }
  const rows = globalSubmissionsForCurrentRevision(draft, globalSubmissions);
  return rows.find((g) => g.decision === "pending");
}

export function hasPendingGlobalSubmission(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): boolean {
  return isAwaitingInitialGlobalReviewerDecisions(draft, globalSubmissions);
}

export {
  canHunterResubmitGlobalRevision,
  hasGlobalRevisionApproval,
  hasGlobalRevisionChangeRequests,
  isAwaitingInitialGlobalReviewerDecisions,
};

/** Hunter may edit this step in the wizard. */
export function isWizardStepEditableForDraft(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  stepStatus: ReportDraftDomainModel.StepStatus,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission> = [],
): boolean {
  if (isHunterBlockedByPendingGlobalReview(draft, globalSubmissions)) {
    return false;
  }
  if (isSuperAdminGlobalRevisionMode(draft)) {
    return isGlobalStepEditable(stepStatus);
  }
  return stepStatus === "in-progress" || stepStatus === "needs-revision";
}

/** Steps the hunter can batch-submit during global revision. */
export function countStepsEligibleForGlobalSubmit(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission> = [],
): number {
  if (!draft || !isSuperAdminGlobalRevisionMode(draft)) return 0;
  if (!canHunterResubmitGlobalRevision(draft, globalSubmissions)) return 0;
  return REPORT_DRAFT_STEP_STATE_KEYS.filter((key) =>
    isGlobalStepEligibleForSubmit(draft[key].status),
  ).length;
}

export function canWizardNavigateNext(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  stepStatus: ReportDraftDomainModel.StepStatus,
): boolean {
  if (isSuperAdminGlobalRevisionMode(draft)) return true;
  return stepStatus === "approved";
}

export function canApproveFinalValidation(
  draft: ReportDraftDomainModel.ReportDraft,
): boolean {
  return draft.aggregateStatus === "ready-to-program" && draft.final.status === "approved";
}

/** Super-admin may open the global revision cycle only once per draft. */
export function canRequestFinalRevision(
  draft: ReportDraftDomainModel.ReportDraft,
  _globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission> = [],
): boolean {
  if (draft.aggregateStatus !== "ready-to-program") {
    return false;
  }
  return (draft.superAdminGlobalRevisionCount ?? 0) === 0;
}

/** Global revision cycle is open (hunter may submit globally). */
export function isGlobalRevisionCycleOpen(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
): boolean {
  return Boolean(draft?.superAdminRevisionRequestedAt?.trim());
}

/** QC/SA may still approve or request changes on this global submission row. */
export function canDecideOnGlobalSubmission(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmission: ReportDraftDomainModel.GlobalSubmission | undefined,
): boolean {
  if (!draft || !globalSubmission) return false;
  if (!isGlobalRevisionCycleOpen(draft)) return false;
  return globalSubmission.decision === "pending";
}

/** SA actionable pending row while the global revision cycle is still open. */
export function findActivePendingGlobalSubmissionForSuperAdmin(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): ReportDraftDomainModel.GlobalSubmission | undefined {
  if (!isGlobalRevisionCycleOpen(draft)) return undefined;
  return findPendingGlobalSubmissionForRole(draft, globalSubmissions, "super_admin");
}

/** Who closed the global revision cycle (manual approve with decidedBy), if any. */
export function findGlobalRevisionClosingApproval(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): { revisionNumber: number; reviewerRole: ReportDraftDomainModel.ReviewerRole } | undefined {
  if (!draft || isGlobalRevisionCycleOpen(draft)) return undefined;
  if ((draft.superAdminGlobalRevisionCount ?? 0) < 1) return undefined;

  const forDraft = globalSubmissions.filter((g) => g.reportDraftId === draft.id);
  const withDecider = forDraft
    .filter((g) => g.decision === "approve" && g.decidedBy?.trim())
    .sort((a, b) => b.revisionNumber - a.revisionNumber);
  if (withDecider[0]) {
    return {
      revisionNumber: withDecider[0].revisionNumber,
      reviewerRole: withDecider[0].reviewerRole,
    };
  }

  const anyApprove = forDraft
    .filter((g) => g.decision === "approve")
    .sort((a, b) => b.revisionNumber - a.revisionNumber)[0];
  if (!anyApprove) return undefined;
  return {
    revisionNumber: anyApprove.revisionNumber,
    reviewerRole: anyApprove.reviewerRole,
  };
}

export type FinalValidationStatusKind =
  | "submitted"
  | "global-cycle-closed"
  | "global-cycle-open-pending-sa"
  | "global-cycle-open"
  | "awaiting-ready"
  | "ready-no-global-yet";

export function resolveFinalValidationStatus(
  draft: ReportDraftDomainModel.ReportDraft,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): {
  kind: FinalValidationStatusKind;
  revision?: number;
  validatorRole?: ReportDraftDomainModel.ReviewerRole;
} {
  if (draft.aggregateStatus === "submitted-to-program") {
    return { kind: "submitted" };
  }

  const closing = findGlobalRevisionClosingApproval(draft, globalSubmissions);
  if (closing && draft.aggregateStatus === "ready-to-program") {
    return {
      kind: "global-cycle-closed",
      revision: closing.revisionNumber,
      validatorRole: closing.reviewerRole,
    };
  }

  if (isGlobalRevisionCycleOpen(draft)) {
    const revision = draft.superAdminGlobalRevisionCount ?? 1;
    if (findActivePendingGlobalSubmissionForSuperAdmin(draft, globalSubmissions)) {
      return { kind: "global-cycle-open-pending-sa", revision };
    }
    return { kind: "global-cycle-open", revision };
  }

  if (draft.aggregateStatus === "ready-to-program") {
    return { kind: "ready-no-global-yet" };
  }

  return { kind: "awaiting-ready" };
}

export function hasSuperAdminFeedback(
  draftId: string,
  submissions: ReadonlyArray<ReportDraftDomainModel.Submission<unknown>>,
  comments: ReadonlyArray<ReportDraftDomainModel.ReviewerComment>,
): boolean {
  const superAdminSubIds = new Set(
    submissions
      .filter((s) => s.reportDraftId === draftId && s.reviewerRole === "super_admin")
      .map((s) => s.id),
  );
  return comments.some(
    (c) =>
      superAdminSubIds.has(c.submissionId) &&
      c.authorRole === "super_admin" &&
      c.body.trim() !== "" &&
      (c.anchor == null || c.anchor.field === GENERAL_REVIEW_COMMENT_FIELD),
  );
}

/** True when any step is in a global-revision status (sanity check / UI). */
export function draftHasGlobalStepStatuses(
  draft: ReportDraftDomainModel.ReportDraft,
): boolean {
  return REPORT_DRAFT_STEP_STATE_KEYS.some((key) => isGlobalStepStatus(draft[key].status));
}
