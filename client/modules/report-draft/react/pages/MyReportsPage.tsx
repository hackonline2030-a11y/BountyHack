"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useT } from "next-i18next/client";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { useMyReportsPage } from "@modules/report-draft/react/pages/use-my-reports-page";

const STEP_KEYS = [
  "meta",
  "description",
  "collection",
  "exploitation",
  "proofOfConcept",
  "risks",
  "remediation",
  "final",
] as const satisfies ReadonlyArray<keyof ReportDraftDomainModel.ReportDraft>;
const STEPS_TOTAL = STEP_KEYS.length;

type Props = {
  hunterId: number;
  lng: string;
};

/**
 * Client-side root of the `/my-reports` route. Holds no business logic —
 * all the data-flow + create-and-navigate orchestration lives in
 * `useMyReportsPage`. This component only renders the four UI states
 * (loading skeleton, error, empty, list) and the "Nouveau rapport" CTA.
 */
export const MyReportsPage: React.FC<Props> = ({ hunterId, lng }) => {
  const { t } = useT("myReports");
  const { loadStatus, drafts, isCreating, createDraft } = useMyReportsPage({
    hunterId,
    lng,
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
      <header className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-heading-on-pattern sm:text-3xl">
            {t("myReports.heading")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-dashboard-subheading-on-pattern sm:text-base">
            {t("myReports.subheading")}
          </p>
        </div>

        <button
          type="button"
          onClick={createDraft}
          disabled={isCreating}
          className="inline-flex items-center justify-center rounded-md bg-dashboard-accent px-4 py-2 text-sm font-semibold text-dashboard-accent-on shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dashboard-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating
            ? t("myReports.actions.creating")
            : t("myReports.actions.newReport")}
        </button>
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
          ctaLabel={t("myReports.list.empty.cta")}
          onCta={createDraft}
          disabled={isCreating}
        />
      ) : null}

      {showList ? (
        <ul
          role="list"
          className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {drafts.map((draft) => (
            <li key={draft.id}>
              <DraftCard
                draft={draft}
                lng={lng}
                dateFormatter={dateFormatter}
                t={t}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Internal subcomponents
// ───────────────────────────────────────────────────────────────────────

type TFunction = ReturnType<typeof useT>["t"];

const DraftCard: React.FC<{
  draft: ReportDraftDomainModel.ReportDraft;
  lng: string;
  dateFormatter: Intl.DateTimeFormat;
  t: TFunction;
}> = ({ draft, lng, dateFormatter, t }) => {
  const title = draft.meta.payload.reportTitle?.trim() ?? "";
  const displayTitle = title === "" ? t("myReports.card.untitled") : title;

  const approvedSteps = STEP_KEYS.reduce(
    (n, key) => n + (draft[key].status === "approved" ? 1 : 0),
    0,
  );

  return (
    <Link
      href={`/${lng}/report-draft/${draft.id}`}
      aria-label={`${displayTitle} — ${t("myReports.card.open")}`}
      className="group flex h-full flex-col gap-3 rounded-lg border border-dashboard-card-border bg-dashboard-card p-4 shadow-sm transition hover:border-dashboard-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dashboard-accent sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-base font-semibold text-dashboard-text">
          {displayTitle}
        </h2>
        <StatusBadge status={draft.aggregateStatus} t={t} />
      </div>

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
          {STEP_KEYS.map((key) => (
            <span
              key={key}
              aria-hidden
              className={`h-1.5 flex-1 rounded-full ${
                draft[key].status === "approved"
                  ? "bg-dashboard-accent"
                  : draft[key].status === "awaiting-review"
                  ? "bg-dashboard-accent/50"
                  : draft[key].status === "needs-revision"
                  ? "bg-amber-400"
                  : "bg-dashboard-accent-soft"
              }`}
            />
          ))}
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

const StatusBadge: React.FC<{
  status: ReportDraftDomainModel.AggregateStatus;
  t: TFunction;
}> = ({ status, t }) => {
  const tone =
    status === "draft"
      ? "bg-dashboard-accent-soft text-dashboard-accent"
      : status === "under-review"
      ? "bg-amber-100 text-amber-900"
      : status === "ready-to-program"
      ? "bg-emerald-100 text-emerald-900"
      : status === "submitted-to-program"
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

const EmptyState: React.FC<{
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
  disabled: boolean;
}> = ({ title, description, ctaLabel, onCta, disabled }) => (
  <div className="rounded-lg border border-dashed border-dashboard-card-border bg-dashboard-card/50 p-8 text-center sm:p-12">
    <h2 className="text-lg font-semibold text-dashboard-text sm:text-xl">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-dashboard-text-muted">
      {description}
    </p>
    <button
      type="button"
      onClick={onCta}
      disabled={disabled}
      className="mt-6 inline-flex items-center justify-center rounded-md bg-dashboard-accent px-4 py-2 text-sm font-semibold text-dashboard-accent-on shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dashboard-accent disabled:cursor-not-allowed disabled:opacity-60"
    >
      {ctaLabel}
    </button>
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
