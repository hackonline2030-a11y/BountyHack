"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { STEP_TITLE_FR } from "@modules/report-draft/core/model/step-field-catalog";
import {
  submissionRowIsActionable,
  submissionRowIsConsultable,
  submissionRowStatusLabel,
} from "@modules/report-draft/core/model/submission-review-status";
import { listReviewerSubmissions } from "@modules/report-draft/core/useCase/list-reviewer-submissions.usecase";
import {
  isUnauthorizedHttpError,
  sessionExpiredUserMessage,
} from "@/lib/session-refresh";
import { ActionButton } from "@modules/app/nextjs/components/buttons/ActionButton";
import { GlobalRevisionRequestsTable } from "@modules/report-draft/react/components/GlobalRevisionRequestsTable";
import { ScrollableTablePanel } from "@modules/report-draft/react/components/ScrollableTablePanel";
import { SubmissionReviewDraftTitleCell } from "@modules/report-draft/react/components/SubmissionReviewDraftTitleCell";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  lng: string;
};

const decisionLabelFr = (decision: string): string => {
  switch (decision) {
    case "pending":
      return "pending";
    case "endorse":
      return "avis favorable";
    case "request-changes":
      return "révisions";
    default:
      return decision;
  }
};

export const MentorSubmissionsPage: React.FC<Props> = ({ lng }) => {
  const dispatch = useAppDispatch();
  const reviewList = useAppSelector((s) => s.reportDrafts.reviewList);
  const submissionIds = useAppSelector((s) => s.reportDrafts.pendingSubmissionIds);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const draftsById = useAppSelector((s) => s.reportDrafts.byId);

  useEffect(() => {
    void dispatch(listReviewerSubmissions({ reviewerRole: "mentor" }));
  }, [dispatch]);

  const rows = useMemo(
    () =>
      submissionIds
        .map((id) => submissionsById[id])
        .filter((s) => s != null && s.reviewerRole === "mentor"),
    [submissionIds, submissionsById],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-2 py-6 sm:px-4">
      <div className="dashboard-card flex flex-col gap-6 p-5 sm:p-6">
      <header className="mb-6">
        <Link
          href={`/${lng}/welcome-mentor`}
          className="text-sm text-dashboard-accent hover:underline"
        >
          ← Accueil mentor
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-dashboard-text">
          Revues mentor (conseil hunter)
        </h1>
        <p className="text-sm text-dashboard-text-muted">
          Vous donnez un avis au hunter et pouvez demander des révisions.{" "}
          <strong>Seul le quality checker valide l&apos;étape</strong> (bouton Suivant
          côté hunter). Les commentaires du QC sur la même étape apparaissent en lecture
          sur la fiche de revue.
        </p>
      </header>

      <GlobalRevisionRequestsTable
        draftsById={draftsById}
        lng={lng}
        reviewBasePath={`/${lng}/mentor-global-revisions`}
      />

      {reviewList.status === "loading" ? (
        <p className="text-sm text-dashboard-text-muted">Chargement…</p>
      ) : null}
      {reviewList.status === "error" ? (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          {isUnauthorizedHttpError(reviewList.message)
            ? sessionExpiredUserMessage()
            : reviewList.message}
        </p>
      ) : null}

      {reviewList.status === "success" && rows.length === 0 ? (
        <p className="rounded-md border border-dashboard-card-border bg-white p-4 text-sm text-dashboard-text-muted">
          Aucune soumission mentor. Demandez au hunter de cliquer sur « Soumettre pour
          revue » avec « Mentor » sélectionné, puis rafraîchissez.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-dashboard-text">
            Soumissions hunter → mentor
          </h2>
          <ScrollableTablePanel className="mt-3">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-form-border bg-form-overlay text-form-text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">Rapport</th>
                <th className="px-3 py-3 font-medium">ID rapport</th>
                <th className="px-3 py-3 font-medium">Étape</th>
                <th className="px-3 py-3 font-medium">Round</th>
                <th className="px-3 py-3 font-medium">Statut</th>
                <th className="px-3 py-3 font-medium">Soumis le</th>
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((submission) => {
                const draft = draftsById[submission.reportDraftId];
                const statusLabel = submissionRowStatusLabel(submission, draft);
                const actionable = submissionRowIsActionable(submission, draft);
                const consultable =
                  !actionable && submissionRowIsConsultable(submission);

                return (
                  <tr
                    key={submission.id}
                    className="border-b border-form-border last:border-0"
                  >
                    <td className="px-3 py-3 align-top font-medium">
                      <SubmissionReviewDraftTitleCell draft={draft} />
                    </td>
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
                    <td className="px-3 py-3 text-right">
                      {(actionable || consultable) && (
                        <Link
                          href={`/${lng}/mentor-submissions/${submission.id}`}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                            actionable
                              ? "bg-form-accent text-white hover:bg-form-accent-hover"
                              : "border border-form-border text-form-text hover:bg-form-overlay"
                          }`}
                        >
                          {actionable ? "Revoir" : "Consulter"}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </ScrollableTablePanel>
        </section>
      ) : null}

      <ActionButton
        variant="secondary"
        className="mt-4 self-start"
        onClick={() =>
          void dispatch(listReviewerSubmissions({ reviewerRole: "mentor" }))
        }
      >
        Rafraîchir la liste
      </ActionButton>
      </div>
    </div>
  );
};
