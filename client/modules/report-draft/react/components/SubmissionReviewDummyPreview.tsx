"use client";

import { type FC, useMemo } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  cumulativeStepsForReview,
  payloadResolverForReview,
} from "@modules/report-draft/core/view/report-draft-preview-steps";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import { ReportDraftDocumentPreview } from "@modules/report-draft/react/components/ReportDraftDocumentPreview";

function draftWithSubmissionAttachments(
  draft: ReportDraftDomainModel.ReportDraft,
  submissionStep: ReportDraftDomainModel.ReportDraftStep,
  attachmentsSnapshot: ReadonlyArray<ReportDraftDomainModel.Attachment> | undefined,
): ReportDraftDomainModel.ReportDraft {
  if (!attachmentsSnapshot?.length) {
    return draft;
  }
  const key = reportDraftStepToStateKey(submissionStep);
  return {
    ...draft,
    [key]: {
      ...draft[key],
      attachments: [...attachmentsSnapshot],
    },
  };
}

type StepPreviewProps = {
  step: ReportDraftDomainModel.ReportDraftStep;
  draft: ReportDraftDomainModel.ReportDraft;
  submissionPayload: unknown;
  attachmentsSnapshot?: ReadonlyArray<ReportDraftDomainModel.Attachment>;
};

/** QC / mentor — aperçu document d'une étape (snapshot soumis pour l'étape en revue). */
export const SubmissionReviewStepPreview: FC<StepPreviewProps> = ({
  step,
  draft,
  submissionPayload,
  attachmentsSnapshot,
}) => {
  const draftForPreview = useMemo(
    () => draftWithSubmissionAttachments(draft, step, attachmentsSnapshot),
    [draft, step, attachmentsSnapshot],
  );
  const resolvePayload = useMemo(
    () => payloadResolverForReview(draftForPreview, step, submissionPayload),
    [draftForPreview, step, submissionPayload],
  );

  return (
    <ReportDraftDocumentPreview
      draft={draftForPreview}
      steps={[step]}
      resolvePayload={resolvePayload}
    />
  );
};

type CumulativePreviewProps = {
  submissionStep: ReportDraftDomainModel.ReportDraftStep;
  draft: ReportDraftDomainModel.ReportDraft;
  submissionPayload: unknown;
  attachmentsSnapshot?: ReadonlyArray<ReportDraftDomainModel.Attachment>;
};

/** QC / mentor — aperçu cumulatif (étapes approuvées + étape soumise). */
export const SubmissionReviewCumulativePreview: FC<CumulativePreviewProps> = ({
  submissionStep,
  draft,
  submissionPayload,
  attachmentsSnapshot,
}) => {
  const draftForPreview = useMemo(
    () => draftWithSubmissionAttachments(draft, submissionStep, attachmentsSnapshot),
    [draft, submissionStep, attachmentsSnapshot],
  );
  const steps = useMemo(
    () => cumulativeStepsForReview(draftForPreview, submissionStep),
    [draftForPreview, submissionStep],
  );
  const resolvePayload = useMemo(
    () => payloadResolverForReview(draftForPreview, submissionStep, submissionPayload),
    [draftForPreview, submissionStep, submissionPayload],
  );

  return (
    <ReportDraftDocumentPreview
      draft={draftForPreview}
      steps={steps}
      resolvePayload={resolvePayload}
      showCover
    />
  );
};

/** @deprecated Utiliser SubmissionReviewStepPreview */
export const SubmissionReviewStepDummyPreview = SubmissionReviewStepPreview;

/** @deprecated Utiliser SubmissionReviewCumulativePreview */
export const SubmissionReviewCumulativeDummyPreview = SubmissionReviewCumulativePreview;
