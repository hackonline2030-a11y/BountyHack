"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useT } from "next-i18next/client";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { hasOpenSuperAdminRevisionCycle } from "@modules/report-draft/core/model/super-admin-final-validation";
import { formatReportTeamMembersDisplay } from "@modules/report-draft/core/view/format-report-team-members";
import {
  MY_REPORTS_STEP_KEYS,
  countMyReportsValidatedSteps,
  resolveMyReportsStepSegmentTone,
  segmentToneClassName,
  superAdminGlobalRevisionNumber,
} from "@modules/report-draft/core/view/my-reports-card-progress";
import { HunterReviewHistoryTable } from "@modules/report-draft/react/components/HunterReviewHistoryTable";
import { useMyReportsPage } from "@modules/report-draft/react/pages/use-my-reports-page";
import { useAppSelector } from "@store/redux/store";

const STEPS_TOTAL = MY_REPORTS_STEP_KEYS.length;

type Props = {
  hunterId: string;
  lng: string;
};

/**
 * Hunter “Mes rapports” page: list and open existing drafts (creation is not
 * exposed here; the API only allows saving already-provisioned drafts).
 */
export const MyReportsPage: React.FC<Props> = ({ hunterId, lng }) => {
  const { t } = useT(["myReports", "reportTeams"]);
  const { loadStatus, drafts } = useMyReportsPage({
    hunterId,
  });

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lng, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [lng],
  );

  const showEmpty = loadStatus.status === "success" && drafts.length === 0;
  const showList = loadStatus.status === "success" && drafts.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="dashboard-card flex flex-col gap-8 p-5 sm:p-6 lg:p-8">
        <header>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text sm:text-3xl">
              {t("myReports.heading")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-dashboard-text-muted sm:text-base">
              {t("myReports.subheading")}
            </p>
          </div>
        </header>

        {loadStatus.status === "loading" || loadStatus.status === "idle" ? (
          <ListSkeleton ariaLabel={t("myReports.list.loadingAriaLabel")} />
        ) : null}

        {loadStatus.status === "error" ? (
          <ErrorState
            title={t("myReports.list.error.title")}
            description={t("myReports.list.error.description", {
              message: loadStatus.message,
            })}
          />
        ) : null}

        {showEmpty ? (
          <EmptyState
            title={t("myReports.list.empty.title")}
            description={t("myReports.list.empty.description")}
          />
        ) : null}

        {showList ? (
          <>
            <ul
              role="list"
              className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {drafts.map((draft) => (
                <li key={draft.id}>
                  <MyReportsDraftCard
                    draft={draft}
                    lng={lng}
                    dateFormatter={dateFormatter}
                    roleLabel={(role) => t(`reportTeams:reportTeams.roles.${role}`)}
                    t={t}
                  />
                </li>
              ))}
            </ul>
            <HunterReviewHistoryTable lng={lng} />
          </>
        ) : null}
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Internal subcomponents
// ───────────────────────────────────────────────────────────────────────

type TFunction = ReturnType<typeof useT>["t"];

const MyReportsDraftCard: React.FC<{
  draft: ReportDraftDomainModel.ReportDraft;
  lng: string;
  dateFormatter: Intl.DateTimeFormat;
  roleLabel: (role: string) => string;
  t: TFunction;
}> = ({ draft, lng, dateFormatter, roleLabel, t }) => {
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const draftSubmissions = useMemo(
    () =>
      Object.values(submissionsById).filter((s) => s.reportDraftId === draft.id),
    [submissionsById, draft.id],
  );

  const contentTitle = draft.meta.payload.reportTitle?.trim() ?? "";
  const team = draft.reportTeam;
  const headline =
    team?.label?.trim() ||
    (contentTitle === ""
      ? t("myReports.card.untitled")
      : contentTitle);
  const headlineIsTeam = Boolean(team?.label?.trim());

  const membersLine =
    team && team.members.length > 0
      ? formatReportTeamMembersDisplay(team.members, roleLabel)
      : null;

  const approvedSteps = countMyReportsValidatedSteps(draft, draftSubmissions);
  const globalRevisionOpen = hasOpenSuperAdminRevisionCycle(draft);

  return (
    <Link
      href={`/${lng}/report-draft/${draft.id}`}
      aria-label={`${headline} — ${t("myReports.card.open")}`}
      className="group flex h-full flex-col gap-3 rounded-lg border border-dashboard-card-border bg-dashboard-card p-4 shadow-sm transition hover:border-dashboard-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dashboard-accent sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-base font-semibold text-dashboard-text">
          {headline}
        </h2>
        {globalRevisionOpen ? (
          <GlobalRevisionStatusBadge
            revisionNumber={superAdminGlobalRevisionNumber(draft)}
            t={t}
          />
        ) : (
          <StatusBadge status={draft.aggregateStatus} t={t} />
        )}
      </div>

      {headlineIsTeam && contentTitle ? (
        <p className="line-clamp-2 text-xs text-dashboard-text-muted">
          {t("myReports.card.contentTitleSecondary", { title: contentTitle })}
        </p>
      ) : null}

      {membersLine ? (
        <p
          className="line-clamp-2 text-xs text-dashboard-text-subtle"
          title={membersLine}
          aria-label={`${t("myReports.card.teamMembersAria")}: ${membersLine}`}
        >
          {membersLine}
        </p>
      ) : null}


      <p className="text-xs text-dashboard-text-subtle">
        {t("myReports.card.updatedAt", {
          date: dateFormatter.format(new Date(draft.updatedAt)),
        })}
      </p>

      <div className="mt-auto">
        <div
          className="flex gap-1"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STEPS_TOTAL}
          aria-valuenow={approvedSteps}
          aria-label={t("myReports.card.stepsProgressAria", {
            approved: approvedSteps,
            total: STEPS_TOTAL,
          })}
        >
          {MY_REPORTS_STEP_KEYS.map((key) => {
            const tone = resolveMyReportsStepSegmentTone(
              draft,
              key,
              draftSubmissions,
            );
            return (
              <span
                key={key}
                aria-hidden
                className={`h-1.5 flex-1 rounded-full ${segmentToneClassName(tone)}`}
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-dashboard-text-muted">
          {t("myReports.card.stepsProgress", {
            approved: approvedSteps,
            total: STEPS_TOTAL,
          })}
        </p>
      </div>
    </Link>
  );
};

const GlobalRevisionStatusBadge: React.FC<{
  revisionNumber: number;
  t: TFunction;
}> = ({ revisionNumber, t }) => (
  <div className="flex shrink-0 flex-col items-end gap-1">
    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-900">
      {t("myReports.status.globalRevisionInProgress")}
    </span>
    <span className="text-[10px] font-medium text-violet-800">
      {t("myReports.card.globalRevisionNumber", { n: revisionNumber })}
    </span>
  </div>
);

const StatusBadge: React.FC<{
  status: ReportDraftDomainModel.AggregateStatus;
  t: TFunction;
}> = ({ status, t }) => {
  const tone =
    status === "draft"
      ? "bg-dashboard-accent-soft text-dashboard-accent"
      : status === "under-review"
      ? "bg-amber-100 text-amber-900"
      : status === "under-global-review"
      ? "bg-violet-100 text-violet-900"
      : status === "ready-to-program"
      ? "bg-emerald-100 text-emerald-900"
      : status === "published" || status === "submitted-to-program"
      ? "bg-sky-100 text-sky-900"
      : status === "rejected"
      ? "bg-rose-100 text-rose-900"
      : "bg-zinc-200 text-zinc-700";

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}
    >
      {t(`myReports.status.${status}`)}
    </span>
  );
};

const ListSkeleton: React.FC<{ ariaLabel: string }> = ({ ariaLabel }) => (
  <div
    aria-label={ariaLabel}
    aria-busy="true"
    role="status"
    className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3"
  >
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="h-36 animate-pulse rounded-lg border border-dashboard-card-border bg-dashboard-card"
      />
    ))}
  </div>
);

const EmptyState: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="rounded-lg border border-dashed border-dashboard-card-border bg-dashboard-card/50 p-8 text-center sm:p-12">
    <h2 className="text-lg font-semibold text-dashboard-text sm:text-xl">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-dashboard-text-muted">
      {description}
    </p>
  </div>
);

const ErrorState: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div
    role="alert"
    className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900 sm:p-8"
  >
    <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
    <p className="mt-1 text-sm">{description}</p>
  </div>
);
