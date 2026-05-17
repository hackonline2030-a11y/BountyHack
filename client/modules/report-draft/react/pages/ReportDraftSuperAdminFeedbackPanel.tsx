"use client";

import { type FC, useMemo } from "react";
import { useT } from "next-i18next/client";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  REPORT_DRAFT_STEP_STATE_KEYS,
  type ReportDraftStepStateKey,
} from "@modules/report-draft/core/model/report-draft-step-keys";

const STATE_KEY_TO_STEP: Record<
  ReportDraftStepStateKey,
  ReportDraftDomainModel.ReportDraftStep
> = {
  meta: ReportDraftDomainModel.ReportDraftStep.META,
  description: ReportDraftDomainModel.ReportDraftStep.DESCRIPTION,
  collection: ReportDraftDomainModel.ReportDraftStep.COLLECTION,
  exploitation: ReportDraftDomainModel.ReportDraftStep.EXPLOITATION,
  proofOfConcept: ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT,
  risks: ReportDraftDomainModel.ReportDraftStep.RISKS,
  remediation: ReportDraftDomainModel.ReportDraftStep.REMEDIATION,
  final: ReportDraftDomainModel.ReportDraftStep.FINAL,
};
import { GENERAL_REVIEW_COMMENT_FIELD } from "@modules/report-draft/core/model/submission-review-status";
import { ReportDraftGlobalCommentsSection } from "@modules/report-draft/react/components/ReportDraftGlobalCommentsSection";
import { useAppSelector } from "@store/redux/store";

const STEP_LABEL_KEYS: Record<
  (typeof REPORT_DRAFT_STEP_STATE_KEYS)[number],
  string
> = {
  meta: "myReports.superAdminFeedback.steps.meta",
  description: "myReports.superAdminFeedback.steps.description",
  collection: "myReports.superAdminFeedback.steps.collection",
  exploitation: "myReports.superAdminFeedback.steps.exploitation",
  proofOfConcept: "myReports.superAdminFeedback.steps.proofOfConcept",
  risks: "myReports.superAdminFeedback.steps.risks",
  remediation: "myReports.superAdminFeedback.steps.remediation",
  final: "myReports.superAdminFeedback.steps.final",
};

type Props = {
  /** When set (QC/mentor read-only), overrides wizard currentDraftId. */
  draftId?: string;
};

export const ReportDraftSuperAdminFeedbackPanel: FC<Props> = ({ draftId: draftIdProp }) => {
  const { t } = useT("myReports");
  const currentDraftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draftId = draftIdProp ?? currentDraftId;
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const commentsById = useAppSelector((s) => s.reportDrafts.commentsById);

  const byStep = useMemo(() => {
    if (!draftId) return new Map<ReportDraftDomainModel.ReportDraftStep, string>();

    const map = new Map<ReportDraftDomainModel.ReportDraftStep, string>();
    for (const sub of Object.values(submissionsById)) {
      if (sub.reportDraftId !== draftId || sub.reviewerRole !== "super_admin") continue;

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
      map.set(sub.step, latest.body);
    }
    return map;
  }, [draftId, submissionsById, commentsById]);

  if (!draftId) {
    return <p className="text-sm text-form-text-muted">{t("myReports.superAdminFeedback.noDraft")}</p>;
  }

  const entries = REPORT_DRAFT_STEP_STATE_KEYS.flatMap((key) => {
    const step = STATE_KEY_TO_STEP[key];
    const body = byStep.get(step);
    if (!body?.trim()) return [];
    return [{ key, body }];
  });

  return (
    <div className="flex flex-col gap-8">
      <ReportDraftGlobalCommentsSection draftId={draftId} placement="super_admin" />
      {entries.length === 0 ? (
        <p className="text-sm text-form-text-muted">{t("myReports.superAdminFeedback.empty")}</p>
      ) : (
      <ul className="flex flex-col gap-4">
      {entries.map(({ key, body }) => (
        <li
          key={key}
          className="rounded-md border border-form-border bg-form-overlay p-4 text-sm text-form-text"
        >
          <h3 className="mb-2 font-semibold">{t(STEP_LABEL_KEYS[key])}</h3>
          <p className="whitespace-pre-wrap">{body}</p>
        </li>
      ))}
    </ul>
      )}
    </div>
  );
};
