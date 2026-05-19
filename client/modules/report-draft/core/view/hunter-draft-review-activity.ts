import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/** Display name from coordinator-assigned team roster; falls back to a short id. */
export function reviewerDisplayNameFromTeam(
  draft: ReportDraftDomainModel.ReportDraft,
  userId: string,
): string {
  const team = draft.reportTeam;
  if (!team?.members?.length) {
    return userId.length <= 12 ? userId : `${userId.slice(0, 10)}…`;
  }
  const m = team.members.find((x) => x.userId === userId);
  return m?.displayName?.trim() || (userId.length <= 12 ? userId : `${userId.slice(0, 10)}…`);
}

export type MentorEndorsementEntry = {
  step: ReportDraftDomainModel.ReportDraftStep;
  decidedBy: string;
  decidedAt: string;
};

export type HunterDraftActivityHints = {
  /** Latest mentor endorsement on this draft (any step). */
  latestMentorEndorse?: MentorEndorsementEntry;
  /** Most recent comment left by mentor or QC on a submission of this draft. */
  latestStaffComment?: {
    authorId: string;
    authorRole: ReportDraftDomainModel.ReviewerRole;
    body: string;
    createdAt: string;
  };
};

function parseTime(iso: string | undefined): number {
  if (!iso?.trim()) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Derives “mentor endorsement” + “latest staff comment” cues for hunter dashboards.
 * Staff = mentor, quality checker, super_admin (excludes hunter peer comments).
 */
export function hunterDraftActivityHints(
  draft: ReportDraftDomainModel.ReportDraft,
  submissions: readonly ReportDraftDomainModel.Submission<unknown>[],
  allComments: readonly ReportDraftDomainModel.ReviewerComment[],
): HunterDraftActivityHints {
  const forDraft = submissions.filter((s) => s.reportDraftId === draft.id);
  const subIds = new Set(forDraft.map((s) => s.id));

  let bestEndorse: ReportDraftDomainModel.Submission<unknown> | undefined;
  let bestEndorseTs = -1;
  for (const s of forDraft) {
    if (s.decision !== "endorse" || s.reviewerRole !== "mentor") continue;
    const ts = parseTime(s.decidedAt);
    if (ts >= bestEndorseTs) {
      bestEndorseTs = ts;
      bestEndorse = s;
    }
  }

  const staffRoles: ReadonlySet<ReportDraftDomainModel.ReviewerRole> = new Set([
    "mentor",
    "quality_checker",
    "super_admin",
  ]);

  let bestComment: ReportDraftDomainModel.ReviewerComment | undefined;
  let bestCommentTs = -1;
  for (const c of allComments) {
    if (!subIds.has(c.submissionId)) continue;
    if (!staffRoles.has(c.authorRole)) continue;
    const ts = parseTime(c.createdAt);
    if (ts >= bestCommentTs) {
      bestCommentTs = ts;
      bestComment = c;
    }
  }

  const out: HunterDraftActivityHints = {};

  if (bestEndorse?.decidedBy && bestEndorse.decidedAt) {
    out.latestMentorEndorse = {
      step: bestEndorse.step,
      decidedBy: bestEndorse.decidedBy,
      decidedAt: bestEndorse.decidedAt,
    };
  }

  if (bestComment) {
    out.latestStaffComment = {
      authorId: bestComment.authorId,
      authorRole: bestComment.authorRole,
      body: bestComment.body.trim(),
      createdAt: bestComment.createdAt,
    };
  }

  return out;
}

/** All mentor endorsements on a draft, newest first. */
export function listMentorEndorsements(
  draft: ReportDraftDomainModel.ReportDraft,
  submissions: readonly ReportDraftDomainModel.Submission<unknown>[],
): MentorEndorsementEntry[] {
  return submissions
    .filter(
      (s) =>
        s.reportDraftId === draft.id &&
        s.reviewerRole === "mentor" &&
        s.decision === "endorse" &&
        s.decidedBy &&
        s.decidedAt,
    )
    .sort((a, b) => parseTime(b.decidedAt) - parseTime(a.decidedAt))
    .map((s) => ({
      step: s.step,
      decidedBy: s.decidedBy!,
      decidedAt: s.decidedAt!,
    }));
}
