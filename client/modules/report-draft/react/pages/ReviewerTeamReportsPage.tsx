"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useT } from "next-i18next/client";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { formatReportTeamMembersDisplay } from "@modules/report-draft/core/view/format-report-team-members";
import { isSuperAdminGlobalRevisionMode } from "@modules/report-draft/core/model/super-admin-final-validation";
import { listMentorPeerSubmissionsForQc } from "@modules/report-draft/core/useCase/list-mentor-peer-submissions-for-qc.usecase";
import { listReviewerSubmissions } from "@modules/report-draft/core/useCase/list-reviewer-submissions.usecase";
import { ReportDraftAggregateStatusBadge } from "@modules/report-draft/react/components/ReportDraftAggregateStatusBadge";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  lng: string;
  reviewerRole: "quality_checker" | "mentor";
  welcomeHref: string;
  submissionsBasePath: string;
};

export const ReviewerTeamReportsPage: React.FC<Props> = ({
  lng,
  reviewerRole,
  welcomeHref,
  submissionsBasePath,
}) => {
  const { t } = useT(["myReports", "reportTeams"]);
  const dispatch = useAppDispatch();
  const reviewList = useAppSelector((s) => s.reportDrafts.reviewList);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const draftsById = useAppSelector((s) => s.reportDrafts.byId);

  useEffect(() => {
    void dispatch(listReviewerSubmissions({ reviewerRole }));
    if (reviewerRole === "quality_checker") {
      void dispatch(listMentorPeerSubmissionsForQc());
    }
  }, [dispatch, reviewerRole]);

  const roleLabel = (role: string) => t(`reportTeams:reportTeams.roles.${role}`);

  const draftCards = useMemo(() => {
    const ids = new Set<string>();
    for (const sub of Object.values(submissionsById)) {
      if (reviewerRole === "quality_checker") {
        if (sub.reviewerRole === "quality_checker" || sub.reviewerRole === "mentor") {
          ids.add(sub.reportDraftId);
        }
      } else if (sub.reviewerRole === "mentor") {
        ids.add(sub.reportDraftId);
      }
    }

    return [...ids]
      .map((id) => draftsById[id])
      .filter((d): d is ReportDraftDomainModel.ReportDraft => d != null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [submissionsById, draftsById, reviewerRole]);

  return (
    <div className="mx-auto w-full max-w-5xl px-2 py-6 sm:px-4">
      <div className="dashboard-card flex flex-col gap-6 p-5 sm:p-6">
        <header>
          <Link href={welcomeHref} className="text-sm text-dashboard-accent hover:underline">
            ← {t("myReports.teamReports.back")}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-dashboard-text">
            {t("myReports.teamReports.heading")}
          </h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            {t("myReports.teamReports.subheading")}
          </p>
        </header>

        {reviewList.status === "loading" ? (
          <p className="text-sm text-dashboard-text-muted">{t("myReports.teamReports.loading")}</p>
        ) : null}

        {reviewList.status === "success" && draftCards.length === 0 ? (
          <p className="rounded-md border border-dashboard-card-border bg-white p-4 text-sm text-dashboard-text-muted">
            {t("myReports.teamReports.empty")}
          </p>
        ) : null}

        <ul className="grid gap-4 sm:grid-cols-2">
          {draftCards.map((draft) => {
            const title =
              draft.reportTeam?.label?.trim() ||
              draft.meta.payload.reportTitle?.trim() ||
              t("myReports.card.untitled");
            const membersLine =
              draft.reportTeam && draft.reportTeam.members.length > 0
                ? formatReportTeamMembersDisplay(draft.reportTeam.members, roleLabel)
                : null;
            const globalRevision = isSuperAdminGlobalRevisionMode(draft);

            return (
              <li key={draft.id}>
                <Link
                  href={`${submissionsBasePath}?draftId=${encodeURIComponent(draft.id)}`}
                  className="flex h-full flex-col gap-3 rounded-lg border border-dashboard-card-border bg-dashboard-card p-4 shadow-sm transition hover:border-dashboard-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-base font-semibold text-dashboard-text">
                      {title}
                    </h2>
                    <ReportDraftAggregateStatusBadge
                      status={draft.aggregateStatus}
                      label={t(`myReports.status.${draft.aggregateStatus}`)}
                    />
                  </div>
                  {membersLine ? (
                    <p className="line-clamp-2 text-xs text-dashboard-text-subtle">{membersLine}</p>
                  ) : null}
                  {globalRevision ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-950">
                      {t("myReports.teamReports.globalRevisionBadge")}
                    </p>
                  ) : null}
                  <p className="mt-auto text-xs font-medium text-dashboard-accent">
                    {t("myReports.teamReports.openSubmissions")} →
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
