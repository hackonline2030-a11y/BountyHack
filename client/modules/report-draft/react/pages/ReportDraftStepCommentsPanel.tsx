"use client";

import { type FC, useMemo } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  GENERAL_REVIEW_COMMENT_FIELD,
  isGeneralReviewComment,
} from "@modules/report-draft/core/model/submission-review-status";
import { stepFieldsFromPayload } from "@modules/report-draft/core/model/step-field-catalog";
import { useAppSelector } from "@store/redux/store";

/**
 * Commentaires reviewer pour l'étape courante (par champ + commentaire général).
 */
export const ReportDraftStepCommentsPanel: FC = () => {
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const step = useAppSelector((s) => s.reportDraft.step);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const commentsById = useAppSelector((s) => s.reportDrafts.commentsById);

  const fieldLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const sub of Object.values(submissionsById)) {
      if (sub.reportDraftId !== draftId || sub.step !== step) continue;
      for (const row of stepFieldsFromPayload(sub.step, sub.payload)) {
        map.set(row.fieldId, row.label);
      }
    }
    return map;
  }, [draftId, step, submissionsById]);

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

  const commentAnchorLabel = (c: ReportDraftDomainModel.ReviewerComment): string => {
    if (isGeneralReviewComment(c)) return "Commentaire général";
    const field = c.anchor?.field;
    if (!field || field === GENERAL_REVIEW_COMMENT_FIELD) return "Commentaire général";
    return fieldLabels.get(field) ?? field;
  };

  if (!draftId) {
    return <p className="text-sm text-form-text-muted">Aucun brouillon chargé.</p>;
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-form-text-muted">
        Aucun commentaire pour cette étape pour l&apos;instant. Après une demande de révisions,
        les retours du reviewer apparaîtront ici.
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
            {commentAnchorLabel(c)} · {c.authorRole} ·{" "}
            {new Date(c.createdAt).toLocaleString("fr-FR")}
          </p>
          <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
        </li>
      ))}
    </ul>
  );
};
