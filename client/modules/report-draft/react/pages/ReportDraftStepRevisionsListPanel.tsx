"use client";

import { type FC, useMemo } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { useAppSelector } from "@store/redux/store";

const decisionLabelFr = (
  decision: ReportDraftDomainModel.Submission<unknown>["decision"],
): string => {
  switch (decision) {
    case "pending":
      return "En attente de revue";
    case "approve":
      return "Étape validée";
    case "request-changes":
      return "Révisions demandées";
    default:
      return decision;
  }
};

/**
 * Historique des soumissions (rounds) pour l'étape courante du wizard — lecture seule.
 */
export const ReportDraftStepRevisionsListPanel: FC = () => {
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const step = useAppSelector((s) => s.reportDraft.step);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);

  const submissions = useMemo(() => {
    if (!draftId) return [];
    return Object.values(submissionsById)
      .filter((s) => s.reportDraftId === draftId && s.step === step)
      .sort((a, b) => {
        if (a.round !== b.round) return b.round - a.round;
        return b.submittedAt.localeCompare(a.submittedAt);
      });
  }, [draftId, step, submissionsById]);

  if (!draftId) {
    return <p className="text-sm text-form-text-muted">Aucun brouillon chargé.</p>;
  }

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-form-text-muted">
        Aucune soumission pour cette étape. Après envoi en revue, chaque round apparaîtra ici.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {submissions.map((s) => (
        <li
          key={s.id}
          className="rounded-md border border-form-border bg-form-overlay p-3 text-sm"
        >
          <p className="font-medium text-form-text">
            Round {s.round} · {decisionLabelFr(s.decision)}
          </p>
          <p className="mt-1 font-mono text-xs italic text-form-text-muted">
            n° {s.id} — round {s.round}
          </p>
          <p className="mt-2 text-xs text-form-text-muted">
            Soumis le {new Date(s.submittedAt).toLocaleString("fr-FR")}
            {s.decidedAt
              ? ` · décidé le ${new Date(s.decidedAt).toLocaleString("fr-FR")}`
              : null}
          </p>
        </li>
      ))}
    </ul>
  );
};
