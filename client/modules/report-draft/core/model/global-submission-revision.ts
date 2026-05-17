import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

const REVIEWER_ROLES: readonly ReportDraftDomainModel.ReviewerRole[] = [
  "quality_checker",
  "super_admin",
] as const;

/** Global submission rows for the draft's current super-admin revision round. */
export function globalSubmissionsForCurrentRevision(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): ReportDraftDomainModel.GlobalSubmission[] {
  if (!draft) return [];
  const revision = draft.superAdminGlobalRevisionCount ?? 0;
  return globalSubmissions.filter(
    (g) => g.reportDraftId === draft.id && g.revisionNumber === revision,
  );
}

export function findPendingGlobalSubmissionForRole(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
  reviewerRole: ReportDraftDomainModel.ReviewerRole,
): ReportDraftDomainModel.GlobalSubmission | undefined {
  return globalSubmissionsForCurrentRevision(draft, globalSubmissions).find(
    (g) => g.reviewerRole === reviewerRole && g.decision === "pending",
  );
}

/** Hunter just submitted; no reviewer has decided yet on any track. */
export function isAwaitingInitialGlobalReviewerDecisions(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): boolean {
  const rows = globalSubmissionsForCurrentRevision(draft, globalSubmissions);
  return rows.length > 0 && rows.every((g) => g.decision === "pending");
}

/** At least one reviewer asked for changes on the current revision. */
export function hasGlobalRevisionChangeRequests(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): boolean {
  return globalSubmissionsForCurrentRevision(draft, globalSubmissions).some(
    (g) => g.decision === "request-changes",
  );
}

/** At least one reviewer approved the current global revision (QC or SA track). */
export function hasGlobalRevisionApproval(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): boolean {
  return globalSubmissionsForCurrentRevision(draft, globalSubmissions).some(
    (g) => g.decision === "approve",
  );
}

/** Blocks hunter edition while every track is still pending (awaiting first decisions). */
export function isHunterBlockedByPendingGlobalReview(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): boolean {
  return isAwaitingInitialGlobalReviewerDecisions(draft, globalSubmissions);
}

/** Next hunter submit revision number (mirrors server create-global-submission). */
export function resolveHunterGlobalSubmitRevisionNumber(
  draft: ReportDraftDomainModel.ReportDraft,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): number {
  let revisionNumber = draft.superAdminGlobalRevisionCount ?? 0;
  const rowsForRevision = globalSubmissions.filter(
    (g) => g.reportDraftId === draft.id && g.revisionNumber === revisionNumber,
  );
  if (rowsForRevision.length > 0) {
    revisionNumber += 1;
  }
  return revisionNumber;
}

/** Hunter may resubmit globally after at least one reviewer decided (approve or request-changes). */
export function canHunterResubmitGlobalRevision(
  draft: ReportDraftDomainModel.ReportDraft | undefined,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
): boolean {
  const rows = globalSubmissionsForCurrentRevision(draft, globalSubmissions);
  if (rows.length === 0) return true;
  if (isAwaitingInitialGlobalReviewerDecisions(draft, globalSubmissions)) return false;
  return rows.some((g) => g.decision === "request-changes" || g.decision === "approve");
}

/**
 * Hunter-facing placement: group by revision, filter by comment author role
 * (not global submission track — legacy SA comments may sit on the QC row).
 */
export function globalReviewerCommentsForPlacement(
  draftId: string,
  globalSubmissions: ReadonlyArray<ReportDraftDomainModel.GlobalSubmission>,
  comments: ReadonlyArray<ReportDraftDomainModel.GlobalReviewerComment>,
  placement: "quality_checker" | "super_admin",
): Array<{
  revisionNumber: number;
  reviewerRole: ReportDraftDomainModel.ReviewerRole;
  comments: ReportDraftDomainModel.GlobalReviewerComment[];
}> {
  const submissionById = new Map(
    globalSubmissions
      .filter((g) => g.reportDraftId === draftId)
      .map((g) => [g.id, g] as const),
  );

  const byRevision = new Map<number, ReportDraftDomainModel.GlobalReviewerComment[]>();

  for (const c of comments) {
    if (c.authorRole !== placement) continue;
    const submission = submissionById.get(c.globalSubmissionId);
    if (!submission) continue;
    const list = byRevision.get(submission.revisionNumber) ?? [];
    list.push(c);
    byRevision.set(submission.revisionNumber, list);
  }

  return [...byRevision.entries()]
    .map(([revisionNumber, revisionComments]) => ({
      revisionNumber,
      reviewerRole: placement,
      comments: [...revisionComments].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }))
    .sort((a, b) => b.revisionNumber - a.revisionNumber);
}

export { REVIEWER_ROLES };
