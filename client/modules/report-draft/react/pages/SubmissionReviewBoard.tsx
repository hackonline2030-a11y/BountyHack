"use client";

import Link from "next/link";
import { type FC, type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  GENERAL_REVIEW_COMMENT_FIELD,
  isGeneralReviewComment,
  submissionRowStatusLabel,
} from "@modules/report-draft/core/model/submission-review-status";
import {
  STEP_TITLE_FR,
  stepFieldsFromPayload,
} from "@modules/report-draft/core/model/step-field-catalog";
import { SubmissionStepPreview } from "@modules/report-draft/react/components/SubmissionStepPreview";
import {
  SubmissionReviewCumulativeDummyPreview,
  SubmissionReviewStepDummyPreview,
} from "@modules/report-draft/react/components/SubmissionReviewDummyPreview";
import { approveStep } from "@modules/report-draft/core/useCase/approve-step.usecase";
import { listReviewerSubmissions } from "@modules/report-draft/core/useCase/list-reviewer-submissions.usecase";
import { rejectDraft } from "@modules/report-draft/core/useCase/reject-draft.usecase";
import { requestStepRevisions } from "@modules/report-draft/core/useCase/request-step-revisions.usecase";
import type { ReviewerCommentDraft } from "@modules/report-draft/core/model/report-draft.aggregate";
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
  comments: "Commentaires QC",
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
  const draft = useAppSelector((s) =>
    submission ? s.reportDrafts.byId[submission.reportDraftId] : undefined,
  );
  const commentsById = useAppSelector((s) => s.reportDrafts.commentsById);

  const [activeTab, setActiveTab] = useState<ReviewTab>("form");
  const [pendingComments, setPendingComments] = useState<PendingFieldComment[]>([]);
  const [pendingGeneralComment, setPendingGeneralComment] = useState("");
  const [draftingFieldId, setDraftingFieldId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");

  const savedComments = useMemo(
    () => Object.values(commentsById).filter((c) => c.submissionId === submissionId),
    [commentsById, submissionId],
  );

  const fields = useMemo(() => {
    if (!submission) return [];
    return stepFieldsFromPayload(submission.step, submission.payload);
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
  const canDecide = submission.decision === "pending";
  const statusLabel = submissionRowStatusLabel(submission, draft);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-2 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/${lng}/submissions`}
            className="text-sm text-form-accent hover:underline"
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
        <h2 className="text-lg font-semibold text-form-text">Commentaires par champ</h2>
        <p className="mt-1 text-sm text-form-text-muted">
          « Demander une révision » exige au moins un commentaire (champ ou général).
        </p>

        <ul className="mt-4 flex flex-col gap-4">
          {fields.map((row) => {
            const existing = savedComments.filter(
              (c) => !isGeneralReviewComment(c) && c.anchor?.field === row.fieldId,
            );
            const pending = pendingComments.find((c) => c.fieldId === row.fieldId);

            return (
              <li
                key={row.fieldId}
                className="rounded-md border border-form-border bg-form-overlay p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-form-text">{row.label}</p>
                  {canDecide ? (
                    <button
                      type="button"
                      className="rounded-md border border-form-border bg-white px-2 py-1 text-xs font-medium"
                      onClick={() => {
                        setDraftingFieldId(row.fieldId);
                        setDraftBody(pending?.body ?? "");
                      }}
                      disabled={transitionBusy}
                    >
                      Ajouter un commentaire
                    </button>
                  ) : null}
                </div>
                {existing.map((c) => (
                  <p key={c.id} className="mt-2 whitespace-pre-wrap text-sm text-form-text">
                    {c.body}
                  </p>
                ))}
                {pending ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">
                    <span className="text-xs font-semibold">Brouillon · </span>
                    {pending.body}
                  </p>
                ) : null}
                {draftingFieldId === row.fieldId ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      className="min-h-[72px] w-full rounded-md border border-form-border bg-white p-2 text-sm"
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-form-accent px-3 py-1 text-xs font-medium text-white"
                        onClick={addPendingComment}
                      >
                        Ajouter au lot
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-form-border px-3 py-1 text-xs"
                        onClick={() => {
                          setDraftingFieldId(null);
                          setDraftBody("");
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <section className="mt-6 rounded-md border border-form-border bg-form-overlay p-3">
          <h3 className="text-sm font-semibold text-form-text">Commentaire général</h3>
          {savedComments.filter(isGeneralReviewComment).map((c) => (
            <p key={c.id} className="mt-2 whitespace-pre-wrap text-sm text-form-text">
              {c.body}
            </p>
          ))}
          {canDecide ? (
            <textarea
              className="mt-2 min-h-[80px] w-full rounded-md border border-form-border bg-white p-2 text-sm"
              value={pendingGeneralComment}
              onChange={(e) => setPendingGeneralComment(e.target.value)}
              placeholder="Retour global sur cette soumission (visible par le hunter)"
              disabled={transitionBusy}
            />
          ) : null}
        </section>
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("stepPreview")}
        hidden={activeTab !== "stepPreview"}
        aria-labelledby={tabButtonId("stepPreview")}
      >
        <SubmissionReviewStepDummyPreview step={submission.step} />
      </div>

      <div
        role="tabpanel"
        id={tabPanelId("cumulativePreview")}
        hidden={activeTab !== "cumulativePreview"}
        aria-labelledby={tabButtonId("cumulativePreview")}
      >
        <SubmissionReviewCumulativeDummyPreview
          submissionStep={submission.step}
          draft={draft}
        />
      </div>

      {canDecide ? (
        <div className="flex flex-wrap gap-3 border-t border-form-border pt-4">
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={transitionBusy}
            onClick={() => void onApprove()}
          >
            Valider cette étape
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
  );
};
