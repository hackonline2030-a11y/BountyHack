"use client";

import { type FC } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { normalizeDescriptionPayload } from "@modules/report-draft/core/model/description.factory";
import { normalizeLongFormPayload } from "@modules/report-draft/core/model/long-form-steps.factory";
import {
  STEP_TITLE_FR,
  stepCommentGroupsFromPayload,
  stepFieldsFromPayload,
} from "@modules/report-draft/core/model/step-field-catalog";
import { SectionBlocDisplay } from "@modules/report-draft/react/components/section-bloc/SectionBlocDisplay";

const Step = ReportDraftDomainModel.ReportDraftStep;

type Props = {
  step: ReportDraftDomainModel.ReportDraftStep;
  payload: unknown;
  reportTitle?: string;
  draftId?: string;
  attachments?: ReadonlyArray<ReportDraftDomainModel.Attachment>;
};

function isLongFormStep(step: ReportDraftDomainModel.ReportDraftStep): boolean {
  return step !== Step.META && step !== Step.DESCRIPTION;
}

const StepPreviewHeader: FC<{
  step: ReportDraftDomainModel.ReportDraftStep;
  reportTitle?: string;
}> = ({ step, reportTitle }) => (
  <header className="mb-4 border-b border-form-border pb-3">
    <p className="text-xs uppercase tracking-wide text-form-text-muted">Aperçu soumis</p>
    <h2 className="text-lg font-semibold text-form-text">{STEP_TITLE_FR[step]}</h2>
    {reportTitle ? <p className="mt-1 text-sm text-form-text-muted">{reportTitle}</p> : null}
  </header>
);

/**
 * Read-only preview of what the hunter submitted for one wizard step.
 */
export const SubmissionStepPreview: FC<Props> = ({
  step,
  payload,
  reportTitle,
  draftId,
  attachments = [],
}) => {
  if (isLongFormStep(step)) {
    const { sectionBlocs } = normalizeLongFormPayload(step, payload);
    return (
      <article className="rounded-lg border border-form-border bg-white p-4 shadow-sm">
        <StepPreviewHeader step={step} reportTitle={reportTitle} />
        {sectionBlocs.length === 0 ? (
          <p className="text-sm text-form-text-muted">Aucune section.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {sectionBlocs.map((bloc, index) => (
              <SectionBlocDisplay
                key={bloc.id}
                bloc={bloc}
                index={index}
                draftId={draftId}
                attachments={attachments}
              />
            ))}
          </div>
        )}
      </article>
    );
  }

  if (step === Step.DESCRIPTION) {
    const desc = normalizeDescriptionPayload(payload);
    const cvssGroups = stepCommentGroupsFromPayload(step, payload).filter(
      (g) => g.sectionHeading === "Métriques CVSS",
    );
    const cvssFields = cvssGroups.flatMap((g) => g.fields);

    return (
      <article className="rounded-lg border border-form-border bg-white p-4 shadow-sm">
        <StepPreviewHeader step={step} reportTitle={reportTitle} />
        {cvssFields.length > 0 ? (
          <dl className="mb-6 flex flex-col gap-4">
            <p className="text-sm font-semibold text-form-text">Métriques CVSS</p>
            {cvssFields.map((row) => (
              <div key={row.fieldId}>
                <dt className="text-sm font-medium text-form-text-muted">{row.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-md border border-form-border bg-form-overlay p-2 text-sm text-form-text">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {desc.sectionBlocs.length === 0 ? (
          cvssFields.length === 0 ? (
            <p className="text-sm text-form-text-muted">Aucun contenu soumis.</p>
          ) : null
        ) : (
          <div className="flex flex-col gap-6">
            {desc.sectionBlocs.map((bloc, index) => (
              <SectionBlocDisplay
                key={bloc.id}
                bloc={bloc}
                index={index}
                draftId={draftId}
                attachments={attachments}
              />
            ))}
          </div>
        )}
      </article>
    );
  }

  const fields = stepFieldsFromPayload(step, payload);

  return (
    <article className="rounded-lg border border-form-border bg-white p-4 shadow-sm">
      <StepPreviewHeader step={step} reportTitle={reportTitle} />
      <dl className="flex flex-col gap-4">
        {fields.map((row) => (
          <div key={row.fieldId}>
            <dt className="text-sm font-medium text-form-text-muted">{row.label}</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-md border border-form-border bg-form-overlay p-2 text-sm text-form-text">
              {row.value.trim().length > 0 ? row.value : "—"}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
};
