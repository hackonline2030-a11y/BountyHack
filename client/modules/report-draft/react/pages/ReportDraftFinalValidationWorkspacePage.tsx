"use client";

import Link from "next/link";
import { type FC, type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftAggregateStatusBadge } from "@modules/report-draft/react/components/ReportDraftAggregateStatusBadge";
import { ReportDraftGeneralPreview } from "@modules/report-draft/react/components/ReportDraftGeneralPreview";
import { ReportDraftTeamContextBanner } from "@modules/report-draft/react/components/ReportDraftTeamContextBanner";

type ValidationTab = "generalPreview";

const TAB_ORDER: readonly ValidationTab[] = ["generalPreview"] as const;

type Props = {
  draft: ReportDraftDomainModel.ReportDraft;
  teamsHref: string;
};

const tabButtonId = (key: ValidationTab) => `final-validation-tab-${key}`;
const tabPanelId = (key: ValidationTab) => `final-validation-panel-${key}`;

function reportTitleFromDraft(draft: ReportDraftDomainModel.ReportDraft): string {
  const title = draft.meta.payload?.reportTitle;
  return typeof title === "string" && title.trim() !== "" ? title.trim() : "";
}

export const ReportDraftFinalValidationWorkspacePage: FC<Props> = ({
  draft,
  teamsHref,
}) => {
  const { t } = useT(["reportDraft", "myReports"]);
  const [activeTab, setActiveTab] = useState<ValidationTab>("generalPreview");

  const headline = useMemo(() => {
    const title = reportTitleFromDraft(draft);
    return title || t("reportDraft.finalValidation.table.untitled");
  }, [draft, t]);

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
          href={teamsHref}
          className="inline-flex text-sm font-medium text-form-accent transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent focus-visible:ring-offset-2"
        >
          {t("reportDraft.finalValidation.detail.backToTeams")}
        </Link>
      </div>

      <header className="flex flex-col gap-2 border-b border-form-border pb-4">
        <h1 className="text-xl font-semibold text-form-text sm:text-2xl">{headline}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ReportDraftAggregateStatusBadge
            status={draft.aggregateStatus}
            label={t(`myReports:myReports.status.${draft.aggregateStatus}`)}
          />
          {draft.reportTeam ? (
            <span className="text-sm text-form-text-muted">{draft.reportTeam.label}</span>
          ) : null}
        </div>
      </header>

      {draft.reportTeam ? (
        <ReportDraftTeamContextBanner team={draft.reportTeam} className="mt-0 mb-0" />
      ) : null}

      <div
        role="tablist"
        aria-label={t("reportDraft.finalValidation.detail.tablistAria")}
        className="flex w-full flex-wrap gap-4 border-b border-form-border sm:gap-6"
      >
        {TAB_ORDER.map((key) => {
          const isActive = key === activeTab;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={tabButtonId(key)}
              aria-selected={isActive}
              aria-controls={tabPanelId(key)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(key)}
              onKeyDown={onTabKeyDown}
              className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent ${
                isActive
                  ? "border-form-accent text-form-text"
                  : "border-transparent text-form-text-muted hover:text-form-text"
              }`}
            >
              {t("reportDraft.finalValidation.detail.tabs.generalPreview")}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("generalPreview")}
        aria-labelledby={tabButtonId("generalPreview")}
        hidden={activeTab !== "generalPreview"}
        className="min-h-[200px]"
      >
        <ReportDraftGeneralPreview draft={draft} />
      </div>
    </div>
  );
};
