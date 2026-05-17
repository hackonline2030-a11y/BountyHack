"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  REPORT_DRAFT_STEP_STATE_KEYS,
  type ReportDraftStepStateKey,
} from "@modules/report-draft/core/model/report-draft-step-keys";
import { GENERAL_REVIEW_COMMENT_FIELD } from "@modules/report-draft/core/model/submission-review-status";
import { saveSuperAdminStepComments } from "@modules/report-draft/core/useCase/save-super-admin-step-comments.usecase";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

const STEP_LABEL_KEYS: Record<ReportDraftStepStateKey, string> = {
  meta: "reportDraft.finalValidation.detail.comments.steps.meta",
  description: "reportDraft.finalValidation.detail.comments.steps.description",
  collection: "reportDraft.finalValidation.detail.comments.steps.collection",
  exploitation: "reportDraft.finalValidation.detail.comments.steps.exploitation",
  proofOfConcept: "reportDraft.finalValidation.detail.comments.steps.proofOfConcept",
  risks: "reportDraft.finalValidation.detail.comments.steps.risks",
  remediation: "reportDraft.finalValidation.detail.comments.steps.remediation",
  final: "reportDraft.finalValidation.detail.comments.steps.final",
};

type Props = {
  draftId: string;
};

export const SuperAdminStepCommentsEditor: FC<Props> = ({ draftId }) => {
  const { t } = useT("reportDraft");
  const dispatch = useAppDispatch();
  const transition = useAppSelector((s) => s.reportDrafts.transition);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const commentsById = useAppSelector((s) => s.reportDrafts.commentsById);

  const initialBodies = useMemo(() => {
    const map: Record<ReportDraftStepStateKey, string> = {
      meta: "",
      description: "",
      collection: "",
      exploitation: "",
      proofOfConcept: "",
      risks: "",
      remediation: "",
      final: "",
    };

    const stepByWire = new Map<number, ReportDraftStepStateKey>();
    const Step = ReportDraftDomainModel.ReportDraftStep;
    stepByWire.set(Step.META, "meta");
    stepByWire.set(Step.DESCRIPTION, "description");
    stepByWire.set(Step.COLLECTION, "collection");
    stepByWire.set(Step.EXPLOITATION, "exploitation");
    stepByWire.set(Step.PROOF_OF_CONCEPT, "proofOfConcept");
    stepByWire.set(Step.RISKS, "risks");
    stepByWire.set(Step.REMEDIATION, "remediation");
    stepByWire.set(Step.FINAL, "final");

    for (const sub of Object.values(submissionsById)) {
      if (sub.reportDraftId !== draftId || sub.reviewerRole !== "super_admin") continue;
      const key = stepByWire.get(sub.step);
      if (!key) continue;

      const comments = Object.values(commentsById).filter(
        (c) =>
          c.submissionId === sub.id &&
          c.authorRole === "super_admin" &&
          (c.anchor == null || c.anchor.field === GENERAL_REVIEW_COMMENT_FIELD),
      );
      if (comments.length === 0) continue;
      const latest = comments.reduce((a, b) =>
        a.createdAt >= b.createdAt ? a : b,
      );
      map[key] = latest.body;
    }

    return map;
  }, [draftId, submissionsById, commentsById]);

  const [bodies, setBodies] = useState(initialBodies);

  useEffect(() => {
    setBodies(initialBodies);
  }, [initialBodies]);

  const busy = transition.status === "loading";
  const err = transition.status === "error" ? transition.message : null;

  const onSave = useCallback(() => {
    const comments = REPORT_DRAFT_STEP_STATE_KEYS.map((step) => ({
      step,
      body: bodies[step],
    })).filter((c) => c.body.trim() !== "");
    void dispatch(saveSuperAdminStepComments({ draftId, comments }));
  }, [bodies, dispatch, draftId]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-form-text-muted">
        {t("reportDraft.finalValidation.detail.comments.intro")}
      </p>
      <ul className="flex flex-col gap-5">
        {REPORT_DRAFT_STEP_STATE_KEYS.map((step) => (
          <li key={step} className="flex flex-col gap-2">
            <label
              htmlFor={`super-admin-comment-${step}`}
              className="text-sm font-medium text-form-text"
            >
              {t(STEP_LABEL_KEYS[step])}
            </label>
            <textarea
              id={`super-admin-comment-${step}`}
              rows={3}
              value={bodies[step]}
              onChange={(e) =>
                setBodies((prev) => ({ ...prev, [step]: e.target.value }))
              }
              className="w-full rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm text-form-text"
              placeholder={t("reportDraft.finalValidation.detail.comments.placeholder")}
            />
          </li>
        ))}
      </ul>
      <div>
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="rounded-md border border-form-border bg-form-surface px-4 py-2 text-sm font-semibold text-form-text transition hover:bg-form-overlay disabled:opacity-40"
        >
          {t("reportDraft.finalValidation.detail.comments.save")}
        </button>
      </div>
      {err ? (
        <p role="alert" className="text-sm text-rose-700">
          {err}
        </p>
      ) : null}
    </div>
  );
};
