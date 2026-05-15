"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { STEP_TITLE_FR } from "@modules/report-draft/core/model/step-field-catalog";
import {
  submissionRowIsActionable,
  submissionRowStatusLabel,
} from "@modules/report-draft/core/model/submission-review-status";
import { listReviewerSubmissions } from "@modules/report-draft/core/useCase/list-reviewer-submissions.usecase";
import {
  isUnauthorizedHttpError,
  sessionExpiredUserMessage,
} from "@/lib/session-refresh";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  lng: string;
};

const decisionLabelFr = (
  decision: string,
): string => {
  switch (decision) {
    case "pending":
      return "pending";
    case "approve":
      return "approuvé";
    case "request-changes":
      return "révisions";
    default:
      return decision;
  }
};

export const QualityCheckerSubmissionsPage: React.FC<Props> = ({ lng }) => {
  const dispatch = useAppDispatch();
  const reviewList = useAppSelector((s) => s.reportDrafts.reviewList);
  const submissionIds = useAppSelector((s) => s.reportDrafts.pendingSubmissionIds);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const draftsById = useAppSelector((s) => s.reportDrafts.byId);

  useEffect(() => {
    void dispatch(listReviewerSubmissions({ reviewerRole: "quality_checker" }));
  }, [dispatch]);

  const rows = useMemo(
    () =>
      submissionIds
        .map((id) => submissionsById[id])
        .filter((s) => s != null),
    [submissionIds, submissionsById],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-2 py-6">
      <header className="mb-6">
        <Link
          href={`/${lng}/welcome-quality-checker`}
          className="text-sm text-form-accent hover:underline"
        >
          ← Accueil QC
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-form-text">Historique des revues</h1>
        <p className="text-sm text-form-text-muted">
          Une ligne par rapport et par round. Seul le bouton <strong>Revoir</strong> (statut en
          attente) permet de valider ou demander des révisions ; <strong>Consulter</strong> est
          lecture seule. Vérifiez l&apos;ID rapport si plusieurs brouillons sont en parallèle.
        </p>
      </header>

      {reviewList.status === "loading" ? (
        <p className="text-sm text-form-text-muted">Chargement…</p>
      ) : null}
      {reviewList.status === "error" ? (
        <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {isUnauthorizedHttpError(reviewList.message)
            ? sessionExpiredUserMessage()
            : reviewList.message}
        </p>
      ) : null}

      {reviewList.status === "success" && rows.length === 0 ? (
        <p className="rounded-md border border-form-border bg-form-overlay p-4 text-sm text-form-text-muted">
          Aucune soumission enregistrée pour le quality checker. Demandez au hunter de cliquer sur
          « Soumettre pour revue » avec « Quality checker » sélectionné, puis rafraîchissez.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-form-border bg-white shadow-sm">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-form-border bg-form-overlay text-form-text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">Rapport</th>
                <th className="px-3 py-3 font-medium">ID rapport</th>
                <th className="px-3 py-3 font-medium">Étape</th>
                <th className="px-3 py-3 font-medium">Round</th>
                <th className="px-3 py-3 font-medium">Statut</th>
                <th className="px-3 py-3 font-medium">Soumis le</th>
                <th className="px-3 py-3 font-medium">ID soumission</th>
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((submission) => {
                const draft = draftsById[submission.reportDraftId];
                const title =
                  draft?.meta.payload.reportTitle?.trim() ||
                  (draft ? "Sans titre" : "Brouillon introuvable");
                const statusLabel = submissionRowStatusLabel(submission, draft);
                const actionable = submissionRowIsActionable(submission, draft);

                return (
                  <tr
                    key={submission.id}
                    className="border-b border-form-border last:border-0"
                  >
                    <td className="px-3 py-3 font-medium text-form-text">{title}</td>
                    <td className="max-w-[120px] truncate px-3 py-3 font-mono text-xs text-form-text-muted">
                      {submission.reportDraftId}
                    </td>
                    <td className="px-3 py-3 text-form-text">
                      {STEP_TITLE_FR[submission.step]}
                    </td>
                    <td className="px-3 py-3 text-form-text">{submission.round}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          actionable
                            ? "bg-amber-100 text-amber-950"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <span className="mt-0.5 block text-xs text-form-text-muted">
                        ({decisionLabelFr(submission.decision)})
                      </span>
                    </td>
                    <td className="px-3 py-3 text-form-text-muted">
                      {new Date(submission.submittedAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-3 font-mono text-xs text-form-text-muted">
                      {submission.id}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/${lng}/submissions/${submission.id}`}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                          actionable
                            ? "bg-form-accent text-white hover:bg-form-accent-hover"
                            : "border border-form-border text-form-text hover:bg-form-overlay"
                        }`}
                      >
                        {actionable ? "Revoir" : "Consulter"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <button
        type="button"
        className="mt-4 rounded-md border border-form-border px-4 py-2 text-sm text-form-text hover:bg-form-overlay"
        onClick={() =>
          void dispatch(listReviewerSubmissions({ reviewerRole: "quality_checker" }))
        }
      >
        Rafraîchir la liste
      </button>
    </div>
  );
};
