"use client";

import { type FC, useMemo } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  cumulativeStepsForReview,
  payloadResolverForReview,
} from "@modules/report-draft/core/view/report-draft-preview-steps";
import { ReportDraftDocumentPreview } from "@modules/report-draft/react/components/ReportDraftDocumentPreview";

type StepPreviewProps = {
  step: ReportDraftDomainModel.ReportDraftStep;
  draft: ReportDraftDomainModel.ReportDraft;
  submissionPayload: unknown;
};

/** QC / mentor — aperçu document d'une étape (snapshot soumis pour l'étape en revue). */
export const SubmissionReviewStepPreview: FC<StepPreviewProps> = ({
  step,
  draft,
  submissionPayload,
}) => {
  const resolvePayload = useMemo(
    () => payloadResolverForReview(draft, step, submissionPayload),
    [draft, step, submissionPayload],
  );

  return (
    <ReportDraftDocumentPreview
      draft={draft}
      steps={[step]}
      resolvePayload={resolvePayload}
    />
  );
};

type CumulativePreviewProps = {
  submissionStep: ReportDraftDomainModel.ReportDraftStep;
  draft: ReportDraftDomainModel.ReportDraft;
  submissionPayload: unknown;
};

/** QC / mentor — aperçu cumulatif (étapes approuvées + étape soumise). */
export const SubmissionReviewCumulativePreview: FC<CumulativePreviewProps> = ({
  submissionStep,
  draft,
  submissionPayload,
}) => {
  const steps = useMemo(
    () => cumulativeStepsForReview(draft, submissionStep),
    [draft, submissionStep],
  );
  const resolvePayload = useMemo(
    () => payloadResolverForReview(draft, submissionStep, submissionPayload),
    [draft, submissionStep, submissionPayload],
  );

  return (
    <ReportDraftDocumentPreview
      draft={draft}
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
