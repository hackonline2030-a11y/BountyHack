"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { STEP_TITLE_FR } from "@modules/report-draft/core/model/step-field-catalog";
import {
  submissionRowIsActionable,
  submissionRowStatusLabel,
} from "@modules/report-draft/core/model/submission-review-status";
import { listMentorPeerSubmissionsForQc } from "@modules/report-draft/core/useCase/list-mentor-peer-submissions-for-qc.usecase";
import { listReviewerSubmissions } from "@modules/report-draft/core/useCase/list-reviewer-submissions.usecase";
import {
  isUnauthorizedHttpError,
  sessionExpiredUserMessage,
} from "@/lib/session-refresh";
import { ActionButton } from "@modules/app/nextjs/components/buttons/ActionButton";
import { SubmissionReviewDraftTitleCell } from "@modules/report-draft/react/components/SubmissionReviewDraftTitleCell";
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
    case "endorse":
      return "avis mentor OK";
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

  const mentorPeerIds = useAppSelector((s) => s.reportDrafts.mentorPeerSubmissionIds);

  useEffect(() => {
    void dispatch(listReviewerSubmissions({ reviewerRole: "quality_checker" }));
    void dispatch(listMentorPeerSubmissionsForQc());
  }, [dispatch]);

  const rows = useMemo(
    () =>
      submissionIds
        .map((id) => submissionsById[id])
        .filter((s) => s != null && s.reviewerRole === "quality_checker"),
    [submissionIds, submissionsById],
  );

  const mentorRows = useMemo(
    () =>
      mentorPeerIds
        .map((id) => submissionsById[id])
        .filter((s) => s != null && s.reviewerRole === "mentor"),
    [mentorPeerIds, submissionsById],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-2 py-6 sm:px-4">
      <div className="dashboard-card flex flex-col gap-6 p-5 sm:p-6">
      <header className="mb-6">
        <Link
          href={`/${lng}/welcome-quality-checker`}
          className="text-sm text-dashboard-accent hover:underline"
        >
          ← Accueil QC
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-dashboard-text">Historique des revues</h1>
        <p className="text-sm text-dashboard-text-muted">
          Seul le QC peut <strong>valider l&apos;étape</strong> (bouton Suivant côté hunter). Les
          retours mentor sur vos équipes sont listés en bas (lecture seule + commentaires partagés
          sur la fiche de revue).
        </p>
      </header>

      {reviewList.status === "loading" ? (
        <p className="text-sm text-dashboard-text-muted">Chargement…</p>
      ) : null}
      {reviewList.status === "error" ? (
        <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {isUnauthorizedHttpError(reviewList.message)
            ? sessionExpiredUserMessage()
            : reviewList.message}
        </p>
      ) : null}

      {reviewList.status === "success" && rows.length === 0 ? (
        <p className="rounded-md border border-dashboard-card-border bg-white p-4 text-sm text-dashboard-text-muted">
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
                const statusLabel = submissionRowStatusLabel(submission, draft);
                const actionable = submissionRowIsActionable(submission, draft);

                return (
                  <tr
                    key={submission.id}
                    className="border-b border-form-border last:border-0"
                  >
                    <td className="px-3 py-3 align-top">
                      <SubmissionReviewDraftTitleCell draft={draft} />
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

      {mentorRows.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-dashboard-text">Conseil mentor (lecture seule)</h2>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Soumissions adressées au mentor sur vos équipes rapport. Ouvrez une ligne pour lire les
            commentaires ; validez l&apos;étape depuis une ligne QC ci-dessus.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-violet-200 bg-white shadow-sm">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-violet-100 bg-violet-50 text-form-text-muted">
                <tr>
                  <th className="px-3 py-3 font-medium">Rapport</th>
                  <th className="px-3 py-3 font-medium">Étape</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {mentorRows.map((submission) => {
                  const draft = draftsById[submission.reportDraftId];
                  const statusLabel = submissionRowStatusLabel(submission, draft);
                  return (
                    <tr
                      key={submission.id}
                      className="border-b border-violet-100 last:border-0"
                    >
                      <td className="px-3 py-3 align-top">
                        <SubmissionReviewDraftTitleCell draft={draft} />
                      </td>
                      <td className="px-3 py-3">{STEP_TITLE_FR[submission.step]}</td>
                      <td className="px-3 py-3 text-form-text-muted">{statusLabel}</td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/${lng}/submissions/${submission.id}`}
                          className="rounded-md border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-950 hover:bg-violet-50"
                        >
                          Consulter
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <ActionButton
        variant="secondary"
        className="mt-4 self-start"
        onClick={() => {
          void dispatch(listReviewerSubmissions({ reviewerRole: "quality_checker" }));
          void dispatch(listMentorPeerSubmissionsForQc());
        }}
      >
        Rafraîchir la liste
      </ActionButton>
      </div>
    </div>
  );
};
