"use client";

import { type FC } from "react";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { StepSectionCommentGroup } from "@modules/report-draft/core/model/step-field-catalog";
import { GENERAL_REVIEW_COMMENT_FIELD } from "@modules/report-draft/core/model/submission-review-status";
import { reviewerRoleLabelFr } from "@modules/report-draft/react/review/reviewer-role-label";

export type PendingFieldComment = {
  fieldId: string;
  body: string;
};

type Props = {
  groups: readonly StepSectionCommentGroup[];
  canDecide: boolean;
  transitionBusy: boolean;
  savedComments: readonly ReportDraftDomainModel.ReviewerComment[];
  pendingComments: readonly PendingFieldComment[];
  draftingFieldId: string | null;
  draftBody: string;
  pendingGeneralComment: string;
  onStartDraft: (fieldId: string, initialBody: string) => void;
  onDraftBodyChange: (body: string) => void;
  onAddPendingComment: () => void;
  onCancelDraft: () => void;
  onPendingGeneralCommentChange: (body: string) => void;
  introText: string;
};

export const SubmissionStepFieldCommentsPanel: FC<Props> = ({
  groups,
  canDecide,
  transitionBusy,
  savedComments,
  pendingComments,
  draftingFieldId,
  draftBody,
  pendingGeneralComment,
  onStartDraft,
  onDraftBodyChange,
  onAddPendingComment,
  onCancelDraft,
  onPendingGeneralCommentChange,
  introText,
}) => (
  <>
    <h2 className="text-lg font-semibold text-form-text">Commentaires par section</h2>
    <p className="mt-1 text-sm text-form-text-muted">{introText}</p>

    {groups.length === 0 ? (
      <p className="mt-4 text-sm text-form-text-muted">
        Aucun contenu soumis à commenter sur cette étape.
      </p>
    ) : (
      <ul className="mt-4 flex flex-col gap-5">
        {groups.map((group) => (
          <li
            key={`section-${group.sectionIndex}`}
            className="rounded-lg border border-form-border bg-form-overlay/60"
          >
            <h3 className="border-b border-form-border bg-form-surface px-3 py-2 text-sm font-semibold text-form-text">
              {group.sectionHeading}
            </h3>
            <ul className="flex flex-col gap-3 p-3">
              {group.fields.map((row) => {
                const existing = savedComments.filter(
                  (c) =>
                    !isGeneralReviewComment(c) && c.anchor?.field === row.fieldId,
                );
                const pending = pendingComments.find((c) => c.fieldId === row.fieldId);

                return (
                  <li
                    key={row.fieldId}
                    className="rounded-md border border-form-border bg-white p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-form-text">{row.label}</p>
                        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-form-text-muted">
                          {row.value}
                        </p>
                      </div>
                      {canDecide ? (
                        <button
                          type="button"
                          className="shrink-0 rounded-md border border-form-border bg-form-surface px-2 py-1 text-xs font-medium"
                          onClick={() => onStartDraft(row.fieldId, pending?.body ?? "")}
                          disabled={transitionBusy}
                        >
                          Ajouter un commentaire
                        </button>
                      ) : null}
                    </div>
                    {existing.map((c) => (
                      <div key={c.id} className="mt-2">
                        <span className="text-xs font-semibold text-form-text-muted">
                          {reviewerRoleLabelFr(c.authorRole)}
                        </span>
                        <p className="whitespace-pre-wrap text-sm text-form-text">{c.body}</p>
                      </div>
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
                          onChange={(e) => onDraftBodyChange(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-md bg-form-accent px-3 py-1 text-xs font-medium text-white"
                            onClick={onAddPendingComment}
                          >
                            Ajouter au lot
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-form-border px-3 py-1 text-xs"
                            onClick={onCancelDraft}
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
          </li>
        ))}
      </ul>
    )}

    <section className="mt-6 rounded-md border border-form-border bg-form-overlay p-3">
      <h3 className="text-sm font-semibold text-form-text">Commentaire libre</h3>
      <p className="mt-0.5 text-xs text-form-text-muted">
        Retour global sur la soumission (en plus des commentaires par section).
      </p>
      {savedComments.filter(isGeneralReviewComment).map((c) => (
        <div key={c.id} className="mt-2">
          <span className="text-xs font-semibold text-form-text-muted">
            {reviewerRoleLabelFr(c.authorRole)}
          </span>
          <p className="whitespace-pre-wrap text-sm text-form-text">{c.body}</p>
        </div>
      ))}
      {canDecide ? (
        <textarea
          className="mt-2 min-h-[80px] w-full rounded-md border border-form-border bg-white p-2 text-sm"
          value={pendingGeneralComment}
          onChange={(e) => onPendingGeneralCommentChange(e.target.value)}
          placeholder="Commentaire libre visible par le hunter"
          disabled={transitionBusy}
        />
      ) : null}
    </section>
  </>
);

function isGeneralReviewComment(c: ReportDraftDomainModel.ReviewerComment): boolean {
  return c.anchor?.field === GENERAL_REVIEW_COMMENT_FIELD;
}
