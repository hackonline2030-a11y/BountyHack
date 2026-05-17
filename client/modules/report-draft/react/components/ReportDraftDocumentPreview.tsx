"use client";

import { Fragment, type FC } from "react";
import { ReportDraftDomainModel as M } from "@modules/report-draft/core/model/report-draft.domain-model";
import { DescriptionFactory } from "@modules/report-draft/core/model/description.factory";
import { normalizeLongFormPayload } from "@modules/report-draft/core/model/long-form-steps.factory";
import {
  cvssBaseScore,
  cvssSeverity,
  cvssVector,
} from "@modules/report-draft/core/cvss/cvss-3.1";
import type { StepPayloadResolver } from "@modules/report-draft/core/view/report-draft-preview-steps";
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

function asDescriptionFields(payload: unknown): M.DescriptionFields {
  return DescriptionFactory.create(
    payload && typeof payload === "object"
      ? (payload as Partial<M.DescriptionFields>)
      : undefined,
  );
}

const PdfChapterHeading: FC<{ title: string }> = ({ title }) => (
  <h2 className="mb-4 text-lg font-bold text-[#c1121f]">{title} :</h2>
);

const DescriptionChapterBody: FC<{ payload: unknown }> = ({ payload }) => {
  const desc = asDescriptionFields(payload);
  const score = cvssBaseScore(desc);
  const severity = cvssSeverity(score);
  const vector = cvssVector(desc);

  if (score == null) {
    return <p className="text-sm text-slate-500">—</p>;
  }

  return (
    <div className="space-y-3 text-sm text-slate-800">
      <p>
        Sévérité estimée : <strong>{severity ?? "—"}</strong>
        {score != null ? ` (score CVSS ${score} / 10)` : ""}.
      </p>
      {vector ? (
        <p className="font-mono text-xs text-slate-600">{vector}</p>
      ) : null}
    </div>
  );
};

const LongFormChapterBody: FC<{
  step: M.ReportDraftStep;
  payload: unknown;
}> = ({ step, payload }) => {
  const { sectionBlocs } = normalizeLongFormPayload(step, payload);
  if (sectionBlocs.length === 0) {
    return <p className="text-sm text-slate-500">—</p>;
  }
  return (
    <div className="flex flex-col">
      {sectionBlocs.map((bloc, index) => (
        <SectionBlocDisplay key={bloc.id} bloc={bloc} index={index} documentMode />
      ))}
    </div>
  );
};

const PdfChapter: FC<{
  step: M.ReportDraftStep;
  resolvePayload: StepPayloadResolver;
}> = ({ step, resolvePayload }) => {
  const title = pdfChapterTitle(step);
  if (!title) return null;

  const payload = resolvePayload(step);
  if (!stepHasPdfChapterContent(step, payload)) return null;

  return (
    <section>
      <PdfChapterHeading title={title} />
      {step === M.ReportDraftStep.DESCRIPTION ? (
        <DescriptionChapterBody payload={payload} />
      ) : (
        <LongFormChapterBody step={step} payload={payload} />
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
  const toc = buildPdfTableOfContents(title, chapterLabels);

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
                <PdfChapter step={step} resolvePayload={resolvePayload} />
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
          <PdfChapter key={step} step={step} resolvePayload={resolvePayload} />
        ))}
      </ReportPreviewA4Page>
    </ReportPreviewScrollArea>
  );
};
