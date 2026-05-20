"use client";

import { Fragment, type FC } from "react";
import { ReportDraftDomainModel as M } from "@modules/report-draft/core/model/report-draft.domain-model";
import { normalizeDescriptionPayload } from "@modules/report-draft/core/model/description.factory";
import { sectionBlocsHaveSubmittedContent } from "@modules/report-draft/core/model/section-bloc";
import { normalizeLongFormPayload } from "@modules/report-draft/core/model/long-form-steps.factory";
import {
  cvssBaseScore,
  cvssSeverity,
  cvssVector,
} from "@modules/report-draft/core/cvss/cvss-3.1";
import type { StepPayloadResolver } from "@modules/report-draft/core/view/report-draft-preview-steps";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import {
  authorNameFromDraft,
  buildPdfTableOfContents,
  pdfChapterTitle,
  reportTitleFromDraft,
  stepHasPdfChapterContent,
} from "@modules/report-draft/core/view/report-draft-pdf-chapters";
import { ReportDraftPdfCoverPage } from "@modules/report-draft/react/components/ReportDraftPdfCoverPage";
import {
  ReportPreviewA4Page,
  ReportPreviewPageBreak,
  ReportPreviewScrollArea,
} from "@modules/report-draft/react/components/report-draft-preview-layout";
import { SectionBlocDisplay } from "@modules/report-draft/react/components/section-bloc/SectionBlocDisplay";

const PdfChapterHeading: FC<{ title: string }> = ({ title }) => (
  <h2 className="mb-4 text-lg font-bold text-[#c1121f]">{title} :</h2>
);

const DescriptionChapterBody: FC<{
  draftId: string;
  payload: unknown;
  attachments: readonly M.Attachment[];
}> = ({ draftId, payload, attachments }) => {
  const desc = normalizeDescriptionPayload(payload);
  const score = cvssBaseScore(desc);
  const severity = cvssSeverity(score);
  const vector = cvssVector(desc);
  const hasBlocs = sectionBlocsHaveSubmittedContent(desc.sectionBlocs);

  if (score == null && !hasBlocs) {
    return <p className="text-sm text-slate-500">—</p>;
  }

  return (
    <div className="space-y-4 text-sm text-slate-800">
      {score != null ? (
        <div className="space-y-3">
          <p>
            Sévérité estimée : <strong>{severity ?? "—"}</strong>
            {` (score CVSS ${score} / 10)`}.
          </p>
          {vector ? (
            <p className="font-mono text-xs text-slate-600">{vector}</p>
          ) : null}
        </div>
      ) : null}
      {hasBlocs ? (
        <div className="flex flex-col">
          {desc.sectionBlocs.map((bloc, index) => (
            <SectionBlocDisplay
              key={bloc.id}
              bloc={bloc}
              index={index}
              documentMode
              draftId={draftId}
              attachments={attachments}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const LongFormChapterBody: FC<{
  draftId: string;
  step: M.ReportDraftStep;
  payload: unknown;
  attachments: readonly M.Attachment[];
}> = ({ draftId, step, payload, attachments }) => {
  const { sectionBlocs } = normalizeLongFormPayload(step, payload);
  if (sectionBlocs.length === 0) {
    return <p className="text-sm text-slate-500">—</p>;
  }
  return (
    <div className="flex flex-col">
      {sectionBlocs.map((bloc, index) => (
        <SectionBlocDisplay
          key={bloc.id}
          bloc={bloc}
          index={index}
          documentMode
          draftId={draftId}
          attachments={attachments}
        />
      ))}
    </div>
  );
};

const PdfChapter: FC<{
  draft: M.ReportDraft;
  step: M.ReportDraftStep;
  resolvePayload: StepPayloadResolver;
}> = ({ draft, step, resolvePayload }) => {
  const title = pdfChapterTitle(step);
  if (!title) return null;

  const payload = resolvePayload(step);
  if (!stepHasPdfChapterContent(step, payload)) return null;
  const attachments = draft[reportDraftStepToStateKey(step)].attachments;

  return (
    <section>
      <PdfChapterHeading title={title} />
      {step === M.ReportDraftStep.DESCRIPTION ? (
        <DescriptionChapterBody
          draftId={draft.id}
          payload={payload}
          attachments={attachments}
        />
      ) : (
        <LongFormChapterBody
          draftId={draft.id}
          step={step}
          payload={payload}
          attachments={attachments}
        />
      )}
    </section>
  );
};

export type ReportDraftDocumentPreviewProps = {
  draft: M.ReportDraft;
  steps: readonly M.ReportDraftStep[];
  resolvePayload: StepPayloadResolver;
  /** Page de garde + sommaire + une feuille A4 par chapitre (aperçu rapport). */
  showCover?: boolean;
};

export const ReportDraftDocumentPreview: FC<ReportDraftDocumentPreviewProps> = ({
  draft,
  steps,
  resolvePayload,
  showCover = false,
}) => {
  const metaPayload = resolvePayload(M.ReportDraftStep.META);
  const title = reportTitleFromDraft(draft, metaPayload);
  const author = authorNameFromDraft(draft);

  const chapterSteps = steps.filter((s) => s !== M.ReportDraftStep.META);
  const renderedChapterSteps = chapterSteps.filter((step) => {
    const chapterTitle = pdfChapterTitle(step);
    return chapterTitle != null && stepHasPdfChapterContent(step, resolvePayload(step));
  });

  const chapterLabels = renderedChapterSteps
    .map((step) => pdfChapterTitle(step))
    .filter((t): t is string => t != null);
  const toc = buildPdfTableOfContents(chapterLabels);

  const showCoverPage =
    showCover || (steps.length === 1 && steps[0] === M.ReportDraftStep.META);

  if (showCover) {
    return (
      <ReportPreviewScrollArea>
        {showCoverPage ? (
          <>
            <ReportPreviewA4Page aria-label="Page de garde">
              <ReportDraftPdfCoverPage title={title} author={author} toc={toc} />
            </ReportPreviewA4Page>
            {renderedChapterSteps.length > 0 ? <ReportPreviewPageBreak /> : null}
          </>
        ) : null}
        {renderedChapterSteps.map((step, index) => {
          const pageNumber = (showCoverPage ? 2 : 1) + index;
          return (
            <Fragment key={step}>
              {index > 0 ? <ReportPreviewPageBreak /> : null}
              <ReportPreviewA4Page aria-label={`Page ${pageNumber}`}>
                <PdfChapter draft={draft} step={step} resolvePayload={resolvePayload} />
              </ReportPreviewA4Page>
            </Fragment>
          );
        })}
      </ReportPreviewScrollArea>
    );
  }

  return (
    <ReportPreviewScrollArea>
      <ReportPreviewA4Page aria-label="Aperçu de l'étape">
        {showCoverPage ? (
          <ReportDraftPdfCoverPage title={title} author={author} toc={[]} />
        ) : null}
        {chapterSteps.map((step) => (
          <PdfChapter key={step} draft={draft} step={step} resolvePayload={resolvePayload} />
        ))}
      </ReportPreviewA4Page>
    </ReportPreviewScrollArea>
  );
};
