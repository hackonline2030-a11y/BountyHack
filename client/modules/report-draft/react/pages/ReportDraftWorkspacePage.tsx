"use client";

import { type FC, type KeyboardEvent, useCallback, useState } from "react";
import { ReportDraftWizardPage } from "@modules/report-draft/react/pages/ReportDraftWizardPage";
import {
  ReportDraftCumulativePreview,
  ReportDraftPreview,
} from "@modules/report-draft/react/components/ReportDraftPreview";

/**
 * Top-level wrapper of the report-draft workspace.
 *
 * Hosts a small tab bar (more tabs may be added later, e.g. comments from
 * MENTOR / QUALITY_CHECKER roles once they're wired):
 *  - "Édition"      : the existing wizard form (unchanged).
 *  - "Aperçu étape" : a pure React preview (no Puppeteer/Chromium) showing the
 *                     content tied to the current step only.
 *  - "Aperçu"       : a pure React preview showing the meta header and every
 *                     section filled so far — i.e. from DESCRIPTION up to and
 *                     including the current step. Future steps are not shown.
 *
 * All panels stay mounted while inactive (just hidden) so the form keeps its
 * local textarea state when the user toggles tabs.
 */
type WorkspaceTab = "form" | "stepPreview" | "cumulativePreview";

const TAB_ORDER: readonly WorkspaceTab[] = [
  "form",
  "stepPreview",
  "cumulativePreview",
] as const;

const TAB_LABELS: Record<WorkspaceTab, string> = {
  form: "Édition",
  stepPreview: "Aperçu étape",
  cumulativePreview: "Aperçu",
};

const tabButtonId = (key: WorkspaceTab) => `report-draft-tab-${key}`;
const tabPanelId = (key: WorkspaceTab) => `report-draft-panel-${key}`;

export const ReportDraftWorkspacePage: FC = () => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("form");

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div
        role="tablist"
        aria-label="Espace de rédaction du rapport"
        className="flex w-full gap-6 border-b border-white/10"
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
              className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("form")}
        aria-labelledby={tabButtonId("form")}
        hidden={activeTab !== "form"}
      >
        <ReportDraftWizardPage />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("stepPreview")}
        aria-labelledby={tabButtonId("stepPreview")}
        hidden={activeTab !== "stepPreview"}
      >
        <ReportDraftPreview />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("cumulativePreview")}
        aria-labelledby={tabButtonId("cumulativePreview")}
        hidden={activeTab !== "cumulativePreview"}
      >
        <ReportDraftCumulativePreview />
      </div>
    </div>
  );
};
