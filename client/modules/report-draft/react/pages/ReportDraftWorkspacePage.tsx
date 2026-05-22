"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type FC, type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import {
  ReportDraftCumulativePreview,
  ReportDraftPreview,
} from "@modules/report-draft/react/components/ReportDraftPreview";
import { ReportDraftStepCommentsPanel } from "@modules/report-draft/react/pages/ReportDraftStepCommentsPanel";
import { ReportDraftStepRevisionsListPanel } from "@modules/report-draft/react/pages/ReportDraftStepRevisionsListPanel";
import { ReportDraftStepAttachmentsPanel } from "@modules/report-draft/react/pages/ReportDraftStepAttachmentsPanel";
import { ReportDraftWizardPage } from "@modules/report-draft/react/pages/ReportDraftWizardPage";
import {
  stepStatusLabelFr,
  stepStatusPillClassFr,
} from "@modules/report-draft/react/wizard/step-status-fr";
import { ReportDraftTeamContextBanner } from "@modules/report-draft/react/components/ReportDraftTeamContextBanner";
import { ReportDraftHunterWriterPanel } from "@modules/report-draft/react/components/ReportDraftHunterWriterPanel";
import { ReportDraftSessionProvider } from "@modules/report-draft/react/context/report-draft-session.context";
import { HunterReviewActivityBanner } from "@modules/report-draft/react/components/HunterReviewActivityBanner";
import { SuperAdminGlobalRevisionBanner } from "@modules/report-draft/react/components/SuperAdminGlobalRevisionBanner";
import { TabNavButton } from "@modules/app/nextjs/components/buttons/TabNavButton";
import { GlobalRevisionEventBanner } from "@modules/report-draft/react/components/GlobalRevisionEventBanner";
import { globalReviewerCommentsForPlacement } from "@modules/report-draft/core/model/global-submission-revision";
import {
  hasSuperAdminFeedback,
  isSuperAdminGlobalRevisionMode,
} from "@modules/report-draft/core/model/super-admin-final-validation";
import { ReportDraftSuperAdminFeedbackPanel } from "@modules/report-draft/react/pages/ReportDraftSuperAdminFeedbackPanel";
import { QualityCriteriaChecklistPanel } from "@modules/quality/react/QualityCriteriaChecklistPanel";
import { useAppSelector } from "@store/redux/store";

/**
 * Enveloppe workspace : onglets Édition / aperçu (sous-onglets étape & global) /
 * **Commentaires** (retours reviewer pour l’étape wizard courante).
 */
type WorkspaceTab =
  | "form"
  | "preview"
  | "attachments"
  | "comments"
  | "criteria"
  | "revisions"
  | "superAdminFeedback";

type PreviewSubTab = "step" | "global";

const BASE_TAB_ORDER: readonly WorkspaceTab[] = [
  "form",
  "preview",
  "attachments",
  "comments",
  "criteria",
  "revisions",
] as const;

const TAB_LABELS: Record<WorkspaceTab, string> = {
  form: "Édition",
  preview: "Aperçu",
  attachments: "Médias (étape)",
  comments: "Commentaires",
  criteria: "Critères qualité",
  revisions: "Mes demandes",
  superAdminFeedback: "Retours super-admin",
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
const previewSubTabButtonId = (key: PreviewSubTab) => `report-draft-preview-subtab-${key}`;
const previewSubTabPanelId = (key: PreviewSubTab) => `report-draft-preview-panel-${key}`;

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
      {(status === "needs-revision" || status === "needs-global-revision") &&
      revisionHint ? (
        <p className="font-mono text-xs italic text-form-text-muted">
          n° {revisionHint.submissionId} — round {revisionHint.round}
        </p>
      ) : null}
    </div>
  );
};

const WorkspaceTeamBanner: FC = () => {
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) => (draftId ? s.reportDrafts.byId[draftId] : undefined));
  if (!draft?.reportTeam) return null;
  return <ReportDraftTeamContextBanner team={draft.reportTeam} className="mt-2 mb-0" />;
};

export const ReportDraftWorkspacePage: FC<{ viewerUserId: string }> = ({
  viewerUserId,
}) => {
  const params = useParams<{ lng?: string }>();
  const lng = typeof params?.lng === "string" && params.lng.trim() !== "" ? params.lng : "fr";
  const { t } = useT("myReports");
  const step = useAppSelector((s) => s.reportDraft.step);
  const currentDraftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) =>
    currentDraftId ? s.reportDrafts.byId[currentDraftId] : undefined,
  );
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const commentsById = useAppSelector((s) => s.reportDrafts.commentsById);
  const globalSubmissionsById = useAppSelector((s) => s.reportDrafts.globalSubmissionsById);
  const globalReviewerCommentsById = useAppSelector(
    (s) => s.reportDrafts.globalReviewerCommentsById,
  );

  const showSuperAdminTab = useMemo(() => {
    if (!draft) return false;
    if (isSuperAdminGlobalRevisionMode(draft)) return true;
    if (
      globalReviewerCommentsForPlacement(
        draft.id,
        Object.values(globalSubmissionsById),
        Object.values(globalReviewerCommentsById),
        "super_admin",
      ).length > 0
    ) {
      return true;
    }
    return hasSuperAdminFeedback(
      draft.id,
      Object.values(submissionsById),
      Object.values(commentsById),
    );
  }, [
    draft,
    submissionsById,
    commentsById,
    globalSubmissionsById,
    globalReviewerCommentsById,
  ]);

  const tabOrder = useMemo(
    () =>
      showSuperAdminTab
        ? ([...BASE_TAB_ORDER, "superAdminFeedback"] as const)
        : BASE_TAB_ORDER,
    [showSuperAdminTab],
  );

  const showHunterBack = Boolean(draft && draft.hunterId === viewerUserId);
  const reportsListHref = useMemo(() => `/${lng}/my-reports`, [lng]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("form");
  const [previewSubTab, setPreviewSubTab] = useState<PreviewSubTab>("step");

  const selectWorkspaceTab = useCallback((key: WorkspaceTab) => {
    setActiveTab(key);
    if (key === "preview") {
      setPreviewSubTab("step");
    }
  }, []);

  const onPreviewSubTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      setPreviewSubTab((current) => (current === "step" ? "global" : "step"));
    },
    [],
  );

  const onTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const currentIndex = tabOrder.indexOf(activeTab);
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex =
        (currentIndex + offset + tabOrder.length) % tabOrder.length;
      selectWorkspaceTab(tabOrder[nextIndex]);
    },
    [activeTab, tabOrder, selectWorkspaceTab],
  );

  return (
    <ReportDraftSessionProvider viewerUserId={viewerUserId}>
      <div className="mx-auto my-6 flex w-full max-w-4xl flex-col gap-6 rounded-lg border border-black/10 bg-form-surface px-4 py-6 shadow-xl sm:my-10 sm:px-6 sm:py-8">
      {showHunterBack ? (
        <div className="-mb-2">
          <Link
            href={reportsListHref}
            className="inline-flex text-sm font-medium text-form-accent transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent focus-visible:ring-offset-2"
            aria-label={t("myReports.workspace.backToReportsAria")}
          >
            {t("myReports.workspace.backToReports")}
          </Link>
        </div>
      ) : null}
      <div
        role="tablist"
        aria-label="Espace de rédaction du rapport"
        className="flex w-full flex-wrap gap-4 border-b border-form-border sm:gap-6"
      >
        {tabOrder.map((key) => {
          const isActive = key === activeTab;
          return (
            <TabNavButton
              key={key}
              active={isActive}
              id={tabButtonId(key)}
              aria-selected={isActive}
              aria-controls={tabPanelId(key)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectWorkspaceTab(key)}
              onKeyDown={onTabKeyDown}
            >
              {key === "attachments"
                ? t("myReports.workspace.tabs.attachments")
                : key === "criteria"
                  ? t("myReports.workspace.tabs.criteria")
                  : key === "preview"
                    ? t("myReports.workspace.tabs.preview")
                    : TAB_LABELS[key]}
            </TabNavButton>
          );
        })}
      </div>

      <WorkspaceTeamBanner />
      <ReportDraftHunterWriterPanel />

      <WorkspaceStepStatusPill />

      <div
        role="tabpanel"
        id={tabPanelId("form")}
        aria-labelledby={tabButtonId("form")}
        hidden={activeTab !== "form"}
      >
        <div className="mb-3 flex flex-col gap-2">
          <SuperAdminGlobalRevisionBanner />
          {currentDraftId ? (
            <GlobalRevisionEventBanner
              draftId={currentDraftId}
              onOpenCommentsTab={() => setActiveTab("comments")}
              onOpenSuperAdminTab={() => setActiveTab("superAdminFeedback")}
            />
          ) : null}
          <HunterReviewActivityBanner />
        </div>
        <ReportDraftWizardPage />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("preview")}
        aria-labelledby={tabButtonId("preview")}
        hidden={activeTab !== "preview"}
        className="flex flex-col gap-4"
      >
        <div
          role="tablist"
          aria-label={t("myReports.workspace.preview.subTabsAria")}
          className="flex flex-wrap gap-2"
        >
          {(["step", "global"] as const).map((subKey) => {
            const isSubActive = previewSubTab === subKey;
            return (
              <button
                key={subKey}
                type="button"
                role="tab"
                id={previewSubTabButtonId(subKey)}
                aria-selected={isSubActive}
                aria-controls={previewSubTabPanelId(subKey)}
                tabIndex={isSubActive ? 0 : -1}
                onClick={() => setPreviewSubTab(subKey)}
                onKeyDown={onPreviewSubTabKeyDown}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent focus-visible:ring-offset-2 ${
                  isSubActive
                    ? "border-form-accent bg-emerald-50 text-form-accent"
                    : "border-form-border bg-form-overlay text-form-text-muted hover:border-form-border-strong hover:text-form-text"
                }`}
              >
                {subKey === "step"
                  ? t("myReports.workspace.preview.step")
                  : t("myReports.workspace.preview.global")}
              </button>
            );
          })}
        </div>
        <p className="text-sm italic leading-relaxed text-form-text-muted">
          {t("myReports.workspace.preview.globalHint")}
        </p>
        <div
          role="tabpanel"
          id={previewSubTabPanelId("step")}
          aria-labelledby={previewSubTabButtonId("step")}
          hidden={previewSubTab !== "step"}
        >
          <ReportDraftPreview />
        </div>
        <div
          role="tabpanel"
          id={previewSubTabPanelId("global")}
          aria-labelledby={previewSubTabButtonId("global")}
          hidden={previewSubTab !== "global"}
        >
          <ReportDraftCumulativePreview />
        </div>
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("attachments")}
        aria-labelledby={tabButtonId("attachments")}
        hidden={activeTab !== "attachments"}
        className="min-h-[120px]"
      >
        <ReportDraftStepAttachmentsPanel step={step} />
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
        id={tabPanelId("criteria")}
        aria-labelledby={tabButtonId("criteria")}
        hidden={activeTab !== "criteria"}
        className="min-h-[120px] rounded-lg border border-form-border bg-form-surface p-4"
      >
        {currentDraftId ? (
          <QualityCriteriaChecklistPanel
            targetTypeCode="report"
            targetRefId={currentDraftId}
            context="submission_review"
            panelIdPrefix="report-draft-workspace-criteria"
          />
        ) : null}
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

      {showSuperAdminTab ? (
        <div
          role="tabpanel"
          id={tabPanelId("superAdminFeedback")}
          aria-labelledby={tabButtonId("superAdminFeedback")}
          hidden={activeTab !== "superAdminFeedback"}
          className="min-h-[120px]"
        >
          <ReportDraftSuperAdminFeedbackPanel />
        </div>
      ) : null}
    </div>
    </ReportDraftSessionProvider>
  );
};
