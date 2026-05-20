"use client";

/** Aperçu = dernier report-draft en base (pas de snapshot soumission / pas d’étape isolée). */

import Link from "next/link";
import { type FC, type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftAggregateStatusBadge } from "@modules/report-draft/react/components/ReportDraftAggregateStatusBadge";
import { ReportDraftGeneralPreview } from "@modules/report-draft/react/components/ReportDraftGeneralPreview";
import { ReportDraftTeamContextBanner } from "@modules/report-draft/react/components/ReportDraftTeamContextBanner";
import { ReportDraftSuperAdminFeedbackPanel } from "@modules/report-draft/react/pages/ReportDraftSuperAdminFeedbackPanel";
import { TabNavButton } from "@modules/app/nextjs/components/buttons/TabNavButton";

type ReviewTab = "reportPreview" | "superAdminFeedback";

const TAB_ORDER: readonly ReviewTab[] = ["reportPreview", "superAdminFeedback"] as const;

type Props = {
  draft: ReportDraftDomainModel.ReportDraft;
  lng: string;
  backHref: string;
};

const tabButtonId = (key: ReviewTab) => `global-revision-review-tab-${key}`;
const tabPanelId = (key: ReviewTab) => `global-revision-review-panel-${key}`;

function reportTitleFromDraft(draft: ReportDraftDomainModel.ReportDraft): string {
  const title = draft.meta.payload?.reportTitle;
  return typeof title === "string" && title.trim() !== "" ? title.trim() : "";
}

export const ReportDraftGlobalRevisionReviewPage: FC<Props> = ({
  draft,
  lng,
  backHref,
}) => {
  const { t } = useT(["myReports", "reportDraft"]);
  const [activeTab, setActiveTab] = useState<ReviewTab>("reportPreview");

  const headline = useMemo(() => {
    const title = reportTitleFromDraft(draft);
    return title || t("myReports.card.untitled");
  }, [draft, t]);

  const requestedAtLabel = useMemo(() => {
    const raw = draft.superAdminRevisionRequestedAt?.trim();
    if (!raw) return null;
    return new Intl.DateTimeFormat(lng, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(raw));
  }, [draft.superAdminRevisionRequestedAt, lng]);

  const onTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      setActiveTab((current) => {
        const currentIndex = TAB_ORDER.indexOf(current);
        const offset = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex =
          (currentIndex + offset + TAB_ORDER.length) % TAB_ORDER.length;
        return TAB_ORDER[nextIndex];
      });
    },
    [],
  );

  return (
    <div className="mx-auto my-6 flex w-full max-w-4xl flex-col gap-6 rounded-lg border border-black/10 bg-form-surface px-4 py-6 shadow-xl sm:my-10 sm:px-6 sm:py-8">
      <div className="-mb-2">
        <Link
          href={backHref}
          className="inline-flex text-sm font-medium text-form-accent transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent focus-visible:ring-offset-2"
        >
          {t("myReports.globalRevisionReview.back")}
        </Link>
      </div>

      <header className="flex flex-col gap-2 border-b border-form-border pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
          {t("myReports.globalRevisionReview.badge")}
        </p>
        <h1 className="text-xl font-semibold text-form-text sm:text-2xl">{headline}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ReportDraftAggregateStatusBadge
            status={draft.aggregateStatus}
            label={t(`myReports.status.${draft.aggregateStatus}`)}
          />
          {requestedAtLabel ? (
            <span className="text-sm text-form-text-muted">
              {t("myReports.globalRevisionReview.requestedAt", { date: requestedAtLabel })}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-form-text-muted">
          {t("myReports.globalRevisionReview.readOnlyHint")}
        </p>
      </header>

      {draft.reportTeam ? (
        <ReportDraftTeamContextBanner team={draft.reportTeam} className="mt-0 mb-0" />
      ) : null}

      <div
        role="tablist"
        aria-label={t("myReports.globalRevisionReview.tablistAria")}
        className="flex w-full flex-wrap gap-4 border-b border-form-border sm:gap-6"
      >
        {TAB_ORDER.map((key) => {
          const isActive = key === activeTab;
          return (
            <TabNavButton
              key={key}
              active={isActive}
              id={tabButtonId(key)}
              aria-selected={isActive}
              aria-controls={tabPanelId(key)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(key)}
              onKeyDown={onTabKeyDown}
            >
              {t(`myReports.globalRevisionReview.tabs.${key}`)}
            </TabNavButton>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("reportPreview")}
        aria-labelledby={tabButtonId("reportPreview")}
        hidden={activeTab !== "reportPreview"}
        className="min-h-[200px]"
      >
        <ReportDraftGeneralPreview draft={draft} />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("superAdminFeedback")}
        aria-labelledby={tabButtonId("superAdminFeedback")}
        hidden={activeTab !== "superAdminFeedback"}
        className="min-h-[120px]"
      >
        <ReportDraftSuperAdminFeedbackPanel draftId={draft.id} />
      </div>
    </div>
  );
};
