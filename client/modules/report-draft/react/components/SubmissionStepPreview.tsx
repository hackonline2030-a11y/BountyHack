"use client";

import { type FC } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { normalizeLongFormPayload } from "@modules/report-draft/core/model/long-form-steps.factory";
import {
  STEP_TITLE_FR,
  stepFieldsFromPayload,
} from "@modules/report-draft/core/model/step-field-catalog";

const Step = ReportDraftDomainModel.ReportDraftStep;

type Props = {
  step: ReportDraftDomainModel.ReportDraftStep;
  payload: unknown;
  reportTitle?: string;
};

function isLongFormStep(step: ReportDraftDomainModel.ReportDraftStep): boolean {
  return step !== Step.META && step !== Step.DESCRIPTION;
}

/**
 * Read-only preview of what the hunter submitted for one wizard step.
 */
export const SubmissionStepPreview: FC<Props> = ({ step, payload, reportTitle }) => {
  if (isLongFormStep(step)) {
    const { sectionBlocs } = normalizeLongFormPayload(step, payload);
    return (
      <article className="rounded-lg border border-form-border bg-white p-4 shadow-sm">
        <header className="mb-4 border-b border-form-border pb-3">
          <p className="text-xs uppercase tracking-wide text-form-text-muted">Aperçu soumis</p>
          <h2 className="text-lg font-semibold text-form-text">{STEP_TITLE_FR[step]}</h2>
          {reportTitle ? (
            <p className="mt-1 text-sm text-form-text-muted">{reportTitle}</p>
          ) : null}
        </header>
        {sectionBlocs.length === 0 ? (
          <p className="text-sm text-form-text-muted">Aucune section.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {sectionBlocs.map((bloc, index) => (
              <section key={bloc.id} className="border-b border-form-border pb-4 last:border-0">
                {bloc.heading.trim() ? (
                  <h3 className="text-base font-semibold text-form-text">{bloc.heading}</h3>
                ) : (
                  <p className="text-xs text-form-text-muted">Section {index + 1}</p>
                )}
                {bloc.subheading.trim() ? (
                  <h4 className="mt-1 text-sm font-medium text-form-text">{bloc.subheading}</h4>
                ) : null}
                {bloc.body.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-form-text">{bloc.body}</p>
                ) : (
                  <p className="mt-2 text-sm text-form-text-muted">—</p>
                )}
              </section>
            ))}
          </div>
        )}
      </article>
    );
  }

  const fields = stepFieldsFromPayload(step, payload);

  return (
    <article className="rounded-lg border border-form-border bg-white p-4 shadow-sm">
      <header className="mb-4 border-b border-form-border pb-3">
        <p className="text-xs uppercase tracking-wide text-form-text-muted">Aperçu soumis</p>
        <h2 className="text-lg font-semibold text-form-text">{STEP_TITLE_FR[step]}</h2>
        {reportTitle ? (
          <p className="mt-1 text-sm text-form-text-muted">{reportTitle}</p>
        ) : null}
      </header>
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
