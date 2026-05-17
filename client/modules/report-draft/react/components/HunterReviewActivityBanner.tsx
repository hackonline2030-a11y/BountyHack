"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useT } from "next-i18next/client";
import {
  hunterDraftActivityHints,
  reviewerDisplayNameFromTeam,
} from "@modules/report-draft/core/view/hunter-draft-review-activity";
import { reviewerRoleLabelFr } from "@modules/report-draft/react/review/reviewer-role-label";
import { reportDraftStepLabel } from "@modules/report-draft/react/wizard/report-draft-step-labels";
import { useAppSelector } from "@store/redux/store";

/**
 * Hunter-only banner (onglet Édition) : dernier avis mentor favorable (avec étape)
 * et dernier commentaire staff.
 */
export const HunterReviewActivityBanner: React.FC = () => {
  const params = useParams<{ lng?: string }>();
  const lng = typeof params?.lng === "string" ? params.lng : "fr";
  const { t } = useT(["myReports", "reportTeams"]);
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) =>
    draftId ? s.reportDrafts.byId[draftId] : undefined,
  );
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const commentsById = useAppSelector((s) => s.reportDrafts.commentsById);

  const { endorseLine, commentLine } = useMemo(() => {
    if (!draft) {
      return { endorseLine: null as string | null, commentLine: null as string | null };
    }
    const submissions = Object.values(submissionsById).filter(
      (s) => s.reportDraftId === draft.id,
    );
    const submissionIds = new Set(submissions.map((s) => s.id));
    const comments = Object.values(commentsById).filter((c) =>
      submissionIds.has(c.submissionId),
    );
    const hints = hunterDraftActivityHints(draft, submissions, comments);

    const dateFmt = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    let endorseLine: string | null = null;
    if (hints.latestMentorEndorse) {
      const e = hints.latestMentorEndorse;
      const name = reviewerDisplayNameFromTeam(draft, e.decidedBy);
      const dateStr = dateFmt.format(new Date(e.decidedAt));
      const step = reportDraftStepLabel(e.step, lng);
      endorseLine = t("myReports.activity.endorseBanner", {
        step,
        name,
        date: dateStr,
      });
    }

    let commentLine: string | null = null;
    if (hints.latestStaffComment) {
      const c = hints.latestStaffComment;
      const name = reviewerDisplayNameFromTeam(draft, c.authorId);
      const roleLabel =
        c.authorRole === "mentor" || c.authorRole === "quality_checker"
          ? t(`reportTeams:reportTeams.roles.${c.authorRole}`)
          : reviewerRoleLabelFr(c.authorRole);
      const dateStr = dateFmt.format(new Date(c.createdAt));
      const preview =
        c.body.length > 160 ? `${c.body.slice(0, 157)}…` : c.body;
      commentLine = `${t("myReports.activity.commentBanner", {
        name,
        role: roleLabel,
        date: dateStr,
      })}${preview.length > 0 ? ` ${t("myReports.activity.commentPreview", { preview })}` : ""}`.trim();
    }

    return { endorseLine, commentLine };
  }, [draft, submissionsById, commentsById, t, lng]);

  if (!draft || (!endorseLine && !commentLine)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {endorseLine ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/95 px-3 py-2 text-sm text-emerald-950 shadow-sm">
          <p className="font-medium leading-snug">{endorseLine}</p>
        </div>
      ) : null}
      {commentLine ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50/95 px-3 py-2 text-sm text-sky-950 shadow-sm">
          <p className="leading-snug">{commentLine}</p>
        </div>
      ) : null}
    </div>
  );
};
