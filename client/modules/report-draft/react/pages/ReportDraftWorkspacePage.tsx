"use client";

import { type FC, type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import {
  ReportDraftCumulativePreview,
  ReportDraftPreview,
} from "@modules/report-draft/react/components/ReportDraftPreview";
import { ReportDraftStepCommentsPanel } from "@modules/report-draft/react/pages/ReportDraftStepCommentsPanel";
import { ReportDraftStepRevisionsListPanel } from "@modules/report-draft/react/pages/ReportDraftStepRevisionsListPanel";
import { ReportDraftWizardPage } from "@modules/report-draft/react/pages/ReportDraftWizardPage";
import {
  stepStatusLabelFr,
  stepStatusPillClassFr,
} from "@modules/report-draft/react/wizard/step-status-fr";
import { useAppSelector } from "@store/redux/store";

/**
 * Enveloppe workspace : onglets Édition / aperçus / **Commentaires** (retours
 * reviewer pour l’étape wizard courante). Sous la barre d’onglets : pill
 * d’état de l’étape (machine à états domaine).
 */
type WorkspaceTab =
  | "form"
  | "stepPreview"
  | "cumulativePreview"
  | "comments"
  | "revisions";

const TAB_ORDER: readonly WorkspaceTab[] = [
  "form",
  "stepPreview",
  "cumulativePreview",
  "comments",
  "revisions",
] as const;

const TAB_LABELS: Record<WorkspaceTab, string> = {
  form: "Édition",
  stepPreview: "Aperçu étape",
  cumulativePreview: "Aperçu",
  comments: "Commentaires",
  revisions: "Liste de mes demandes de révision",
};

const STEP_LABELS: Record<ReportDraftDomainModel.ReportDraftStep, string> = {
  [ReportDraftDomainModel.ReportDraftStep.META]: "Métadonnées",
  [ReportDraftDomainModel.ReportDraftStep.DESCRIPTION]: "Description",
  [ReportDraftDomainModel.ReportDraftStep.COLLECTION]: "Collecte",
  [ReportDraftDomainModel.ReportDraftStep.EXPLOITATION]: "Exploitation",
  [ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT]: "Preuve de concept",
  [ReportDraftDomainModel.ReportDraftStep.RISKS]: "Risques",
  [ReportDraftDomainModel.ReportDraftStep.REMEDIATION]: "Remédiation",
  [ReportDraftDomainModel.ReportDraftStep.FINAL]: "Finalisation",
};

const tabButtonId = (key: WorkspaceTab) => `report-draft-tab-${key}`;
const tabPanelId = (key: WorkspaceTab) => `report-draft-panel-${key}`;

const WorkspaceStepStatusPill: FC = () => {
  const step = useAppSelector((s) => s.reportDraft.step);
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) =>
    draftId ? s.reportDrafts.byId[draftId] : undefined,
  );
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);

  const revisionHint = useMemo(() => {
    if (!draftId) return null;
    const forStep = Object.values(submissionsById).filter(
      (s) => s.reportDraftId === draftId && s.step === step,
    );
    if (forStep.length === 0) return null;
    const latest = forStep.reduce((a, b) => (a.round >= b.round ? a : b));
    return { submissionId: latest.id, round: latest.round };
  }, [draftId, step, submissionsById]);

  if (!draft) return null;

  const key = reportDraftStepToStateKey(step);
  const stepState = draft[key] as ReportDraftDomainModel.StepState<unknown>;
  const status = stepState.status;
  const stepLabel = STEP_LABELS[step];

  return (
    <div className="flex flex-col gap-1 border-b border-form-border px-1 pb-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-form-text-muted">
          Étape — {stepLabel}
        </span>
        <span className={stepStatusPillClassFr(status)}>{stepStatusLabelFr(status)}</span>
      </div>
      {status === "needs-revision" && revisionHint ? (
        <p className="font-mono text-xs italic text-form-text-muted">
          n° {revisionHint.submissionId} — round {revisionHint.round}
        </p>
      ) : null}
    </div>
  );
};

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
    <div className="mx-auto my-6 flex w-full max-w-4xl flex-col gap-6 rounded-lg border border-black/10 bg-form-surface px-4 py-6 shadow-xl sm:my-10 sm:px-6 sm:py-8">
      <div
        role="tablist"
        aria-label="Espace de rédaction du rapport"
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
              {TAB_LABELS[key]}
            </button>
          );
        })}
      </div>

      <WorkspaceStepStatusPill />

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

      <div
        role="tabpanel"
        id={tabPanelId("comments")}
        aria-labelledby={tabButtonId("comments")}
        hidden={activeTab !== "comments"}
        className="min-h-[120px]"
      >
        <ReportDraftStepCommentsPanel />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("revisions")}
        aria-labelledby={tabButtonId("revisions")}
        hidden={activeTab !== "revisions"}
        className="min-h-[120px]"
      >
        <ReportDraftStepRevisionsListPanel />
      </div>
    </div>
  );
};
