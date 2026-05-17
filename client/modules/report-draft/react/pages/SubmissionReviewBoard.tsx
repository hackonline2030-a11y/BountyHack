"use client";

import Link from "next/link";
import { type FC, type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  GENERAL_REVIEW_COMMENT_FIELD,
  submissionRowStatusLabel,
} from "@modules/report-draft/core/model/submission-review-status";
import {
  STEP_TITLE_FR,
  stepCommentGroupsFromPayload,
} from "@modules/report-draft/core/model/step-field-catalog";
import { SubmissionStepPreview } from "@modules/report-draft/react/components/SubmissionStepPreview";
import { SubmissionStepFieldCommentsPanel } from "@modules/report-draft/react/components/review/SubmissionStepFieldCommentsPanel";
import {
  SubmissionReviewCumulativePreview,
  SubmissionReviewStepPreview,
} from "@modules/report-draft/react/components/SubmissionReviewDummyPreview";
import { approveStep } from "@modules/report-draft/core/useCase/approve-step.usecase";
import { listReviewerSubmissions } from "@modules/report-draft/core/useCase/list-reviewer-submissions.usecase";
import { rejectDraft } from "@modules/report-draft/core/useCase/reject-draft.usecase";
import { requestStepRevisions } from "@modules/report-draft/core/useCase/request-step-revisions.usecase";
import type { ReviewerCommentDraft } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftTeamContextBanner } from "@modules/report-draft/react/components/ReportDraftTeamContextBanner";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  submissionId: string;
  reviewerId: string;
  lng: string;
};

type ReviewTab = "form" | "comments" | "stepPreview" | "cumulativePreview";

const TAB_ORDER: readonly ReviewTab[] = [
  "form",
  "comments",
  "stepPreview",
  "cumulativePreview",
] as const;

const TAB_LABELS: Record<ReviewTab, string> = {
  form: "Formulaire hunter",
  comments: "Commentaires (QC + mentor)",
  stepPreview: "Aperçu étape",
  cumulativePreview: "Aperçu rapport",
};

type PendingFieldComment = { fieldId: string; body: string };

const tabButtonId = (key: ReviewTab) => `qc-review-tab-${key}`;
const tabPanelId = (key: ReviewTab) => `qc-review-panel-${key}`;

export const SubmissionReviewBoard: FC<Props> = ({ submissionId, reviewerId, lng }) => {
  const dispatch = useAppDispatch();
  const transition = useAppSelector((s) => s.reportDrafts.transition);
  const submission = useAppSelector((s) => s.reportDrafts.submissionsById[submissionId]);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const draft = useAppSelector((s) =>
    submission ? s.reportDrafts.byId[submission.reportDraftId] : undefined,
  );
  const commentsById = useAppSelector((s) => s.reportDrafts.commentsById);

  const stepPeerSubmissionIds = useMemo(() => {
    if (!submission) return [];
    return Object.values(submissionsById)
      .filter(
        (s) =>
          s.reportDraftId === submission.reportDraftId && s.step === submission.step,
      )
      .map((s) => s.id);
  }, [submissionsById, submission]);

  const [activeTab, setActiveTab] = useState<ReviewTab>("form");
  const [pendingComments, setPendingComments] = useState<PendingFieldComment[]>([]);
  const [pendingGeneralComment, setPendingGeneralComment] = useState("");
  const [draftingFieldId, setDraftingFieldId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");

  const savedComments = useMemo(
    () =>
      Object.values(commentsById).filter((c) =>
        stepPeerSubmissionIds.includes(c.submissionId),
      ),
    [commentsById, stepPeerSubmissionIds],
  );

  const commentGroups = useMemo(() => {
    if (!submission) return [];
    return stepCommentGroupsFromPayload(submission.step, submission.payload);
  }, [submission]);

  const transitionBusy = transition.status === "loading";
  const transitionErr = transition.status === "error" ? transition.message : null;

  const hasPendingRevisionComments =
    pendingComments.length > 0 || pendingGeneralComment.trim().length > 0;

  const addPendingComment = useCallback(() => {
    if (!draftingFieldId || draftBody.trim().length === 0) return;
    setPendingComments((prev) => {
      const without = prev.filter((c) => c.fieldId !== draftingFieldId);
      return [...without, { fieldId: draftingFieldId, body: draftBody.trim() }];
    });
    setDraftingFieldId(null);
    setDraftBody("");
  }, [draftingFieldId, draftBody]);

  const refreshList = useCallback(() => {
    void dispatch(listReviewerSubmissions({ reviewerRole: "quality_checker" }));
  }, [dispatch]);

  const onApprove = useCallback(async () => {
    if (!draft || !submission) return;
    await dispatch(
      approveStep({
        draftId: draft.id,
        submissionId: submission.id,
        decidedBy: reviewerId,
      }),
    );
    refreshList();
  }, [dispatch, draft, submission, reviewerId, refreshList]);

  const onReject = useCallback(async () => {
    if (!draft) return;
    await dispatch(
      rejectDraft({
        draftId: draft.id,
        byUser: reviewerId,
        byRole: "quality_checker",
      }),
    );
    refreshList();
  }, [dispatch, draft, reviewerId, refreshList]);

  const onRequestRevisions = useCallback(async () => {
    if (!draft || !submission || !hasPendingRevisionComments) return;
    const comments: ReviewerCommentDraft[] = pendingComments.map((c) => ({
      body: c.body,
      authorId: reviewerId,
      authorRole: "quality_checker",
      anchor: { field: c.fieldId },
    }));
    if (pendingGeneralComment.trim().length > 0) {
      comments.push({
        body: pendingGeneralComment.trim(),
        authorId: reviewerId,
        authorRole: "quality_checker",
        anchor: { field: GENERAL_REVIEW_COMMENT_FIELD },
      });
    }
    await dispatch(
      requestStepRevisions({
        draftId: draft.id,
        submissionId: submission.id,
        decidedBy: reviewerId,
        comments,
      }),
    );
    setPendingComments([]);
    setPendingGeneralComment("");
    refreshList();
  }, [
    dispatch,
    draft,
    submission,
    reviewerId,
    pendingComments,
    pendingGeneralComment,
    hasPendingRevisionComments,
    refreshList,
  ]);

  const onTabKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    setActiveTab((current) => {
      const currentIndex = TAB_ORDER.indexOf(current);
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + offset + TAB_ORDER.length) % TAB_ORDER.length;
      return TAB_ORDER[nextIndex];
    });
  }, []);

  if (!submission || !draft) {
    return <p className="text-sm text-form-text-muted">Soumission introuvable dans le store.</p>;
  }

  const reportTitle = draft.meta.payload.reportTitle;
  const isQcSubmission =
    submission.reviewerRole === "quality_checker" ||
    submission.reviewerRole === "super_admin";
  const canDecide = submission.decision === "pending" && isQcSubmission;
  const statusLabel = submissionRowStatusLabel(submission, draft);
  const isMentorPeerView = submission.reviewerRole === "mentor";

  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-4 sm:px-4">
      <div className="dashboard-card flex flex-col gap-6 p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/${lng}/submissions`}
            className="text-sm text-dashboard-accent hover:underline"
          >
            ← Retour à l&apos;historique
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-form-text">
            Revue — {STEP_TITLE_FR[submission.step]}
          </h1>
          <p className="text-sm text-form-text-muted">
            Rapport {draft.id} · round {submission.round} · soumis le{" "}
            {new Date(submission.submittedAt).toLocaleString("fr-FR")}
          </p>
          <p className="mt-1 text-xs text-form-text-muted">
            Soumission {submission.id} · {statusLabel}
          </p>
          {isMentorPeerView ? (
            <p className="mt-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-950">
              Fil mentor (lecture seule). Validez l&apos;étape depuis votre propre ligne QC
              « En attente de revue » lorsque le hunter a soumis au quality checker.
            </p>
          ) : (
            <p className="mt-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950">
              Seul le quality checker peut valider l&apos;étape (bouton Suivant côté hunter).
              Les retours mentor sur cette étape sont visibles ci-dessous.
            </p>
          )}
        </div>
        {!canDecide ? (
          <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
            Consultation seule
          </span>
        ) : null}
      </header>

      {transitionErr ? (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900"
        >
          {transitionErr}
        </p>
      ) : null}

      <div
        role="tablist"
        aria-label="Revue de soumission"
        className="flex w-full flex-wrap gap-4 border-b border-form-border"
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
              className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
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

      {draft?.reportTeam ? (
        <ReportDraftTeamContextBanner team={draft.reportTeam} className="mt-2 mb-0" />
      ) : null}

      <div
        role="tabpanel"
        id={tabPanelId("form")}
        hidden={activeTab !== "form"}
        aria-labelledby={tabButtonId("form")}
      >
        <SubmissionStepPreview
          step={submission.step}
          payload={submission.payload}
          reportTitle={reportTitle}
        />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("comments")}
        hidden={activeTab !== "comments"}
        aria-labelledby={tabButtonId("comments")}
        className="rounded-lg border border-form-border bg-form-surface p-4"
      >
        <SubmissionStepFieldCommentsPanel
          groups={commentGroups}
          canDecide={canDecide}
          transitionBusy={transitionBusy}
          savedComments={savedComments}
          pendingComments={pendingComments}
          draftingFieldId={draftingFieldId}
          draftBody={draftBody}
          pendingGeneralComment={pendingGeneralComment}
          onStartDraft={(fieldId, initialBody) => {
            setDraftingFieldId(fieldId);
            setDraftBody(initialBody);
          }}
          onDraftBodyChange={setDraftBody}
          onAddPendingComment={addPendingComment}
          onCancelDraft={() => {
            setDraftingFieldId(null);
            setDraftBody("");
          }}
          onPendingGeneralCommentChange={setPendingGeneralComment}
          introText="Uniquement le contenu réellement soumis, regroupé par section (comme l'aperçu). « Demander une révision » exige au moins un commentaire (section ou libre)."
        />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("stepPreview")}
        hidden={activeTab !== "stepPreview"}
        aria-labelledby={tabButtonId("stepPreview")}
      >
        {draft ? (
          <SubmissionReviewStepPreview
            step={submission.step}
            draft={draft}
            submissionPayload={submission.payload}
          />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("cumulativePreview")}
        hidden={activeTab !== "cumulativePreview"}
        aria-labelledby={tabButtonId("cumulativePreview")}
      >
        {draft ? (
          <SubmissionReviewCumulativePreview
            submissionStep={submission.step}
            draft={draft}
            submissionPayload={submission.payload}
          />
        ) : null}
      </div>

      {canDecide ? (
        <div className="flex flex-wrap gap-3 border-t border-form-border pt-4">
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={transitionBusy}
            onClick={() => void onApprove()}
          >
            Valider l&apos;étape (QC — active Suivant)
          </button>
          <button
            type="button"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            disabled={transitionBusy || !hasPendingRevisionComments}
            onClick={() => void onRequestRevisions()}
          >
            Demander une révision
          </button>
          <button
            type="button"
            className="rounded-md border border-rose-400 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 disabled:opacity-50"
            disabled={transitionBusy}
            onClick={() => void onReject()}
          >
            Rejeter le rapport
          </button>
        </div>
      ) : null}

      {transition.status === "success" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-950">
          Décision enregistrée.
        </p>
      ) : null}

      {!canDecide ? (
        <p className="text-sm text-form-text-muted">
          Cette soumission a déjà été traitée. Pour une nouvelle requête du hunter, ouvrez la
          ligne <strong>En attente de revue</strong> avec le bouton <strong>Revoir</strong> (autre
          identifiant de soumission / round plus récent).
        </p>
      ) : null}
      </div>
    </div>
  );
};
