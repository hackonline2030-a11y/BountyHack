"use client";

import { type FC, useMemo } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { useAppSelector } from "@store/redux/store";

/**
 * Liste des commentaires reviewer rattachés aux soumissions de l’étape
 * courante du wizard (même `reportDraft.step` + `currentDraftId`).
 * Format détaillé / filtrage par round : à affiner plus tard.
 */
export const ReportDraftStepCommentsPanel: FC = () => {
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const step = useAppSelector((s) => s.reportDraft.step);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const commentsById = useAppSelector((s) => s.reportDrafts.commentsById);

  const comments = useMemo(() => {
    if (!draftId) return [];
    const submissionIds = new Set(
      Object.values(submissionsById)
        .filter((s) => s.reportDraftId === draftId && s.step === step)
        .map((s) => s.id),
    );
    return Object.values(commentsById)
      .filter((c) => submissionIds.has(c.submissionId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [draftId, step, submissionsById, commentsById]);

  if (!draftId) {
    return (
      <p className="text-sm text-form-text-muted">Aucun brouillon chargé.</p>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-form-text-muted">
        Aucun commentaire pour cette étape pour l’instant. Après une demande de
        révisions, les retours du reviewer apparaîtront ici.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((c) => (
        <li
          key={c.id}
          className="rounded-md border border-form-border bg-form-overlay p-3 text-sm text-form-text"
        >
          <p className="text-xs text-form-text-muted">
            {c.authorRole} · {new Date(c.createdAt).toLocaleString("fr-FR")}
          </p>
          <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
        </li>
      ))}
    </ul>
  );
};
