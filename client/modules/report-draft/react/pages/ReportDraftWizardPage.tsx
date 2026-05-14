"use client";

import { type FC, type ReactNode, useCallback, useEffect, useState } from "react";
import { DescriptionSection } from "@modules/report-draft/react/sections/description/DescriptionSection";
import { MetaSection } from "@modules/report-draft/react/sections/meta/MetaSection";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

const STEP_LABELS: Record<ReportDraftDomainModel.ReportDraftStep, string> = {
  [ReportDraftDomainModel.ReportDraftStep.META]: "Métadonnées",
  [ReportDraftDomainModel.ReportDraftStep.DESCRIPTION]: "Description",
  [ReportDraftDomainModel.ReportDraftStep.COLLECTION]: "Collecte",
  [ReportDraftDomainModel.ReportDraftStep.EXPLOITATION]: "Exploitation",
  [ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT]: "Preuve de concept",
  [ReportDraftDomainModel.ReportDraftStep.RISKS]: "Risques",
  [ReportDraftDomainModel.ReportDraftStep.REMEDIATION]: "Remédiation",
  [ReportDraftDomainModel.ReportDraftStep.FINAL]: "Finalisation",
};

const TOTAL_STEPS = 8;

/** Route the current step to its dedicated section, or fall back to the legacy textarea body. */
const renderStepBody = (
  step: ReportDraftDomainModel.ReportDraftStep,
  label: string,
): ReactNode => {
  switch (step) {
    case ReportDraftDomainModel.ReportDraftStep.META:
      return <MetaSection />;
    case ReportDraftDomainModel.ReportDraftStep.DESCRIPTION:
      return <DescriptionSection />;
    default:
      return <TextareaStep step={step} label={label} />;
  }
};

export const ReportDraftWizardPage: FC = () => {
  const step = useAppSelector((s) => s.reportDraft.step);
  const label = STEP_LABELS[step];
  const stepIndex = step + 1;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-1 py-2">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-form-text-muted">
          Étape {stepIndex} / {TOTAL_STEPS} (brouillon en mémoire)
        </p>
        <h1 className="text-2xl font-semibold text-form-text">{label}</h1>
      </header>
      {renderStepBody(step, label)}
    </div>
  );
};

type TextareaStepProps = {
  step: ReportDraftDomainModel.ReportDraftStep;
  label: string;
};

/**
 * Legacy single-textarea step. Used for every step that hasn't been
 * migrated to a structured form yet (DESCRIPTION onwards). Mirrors the
 * previous wizard body 1:1 — only the META branch was extracted.
 */
const TextareaStep: FC<TextareaStepProps> = ({ step, label }) => {
  const dispatch = useAppDispatch();
  const fields = useAppSelector((s) => s.reportDraft.fields);
  const [draft, setDraft] = useState(() => fields[step]);

  useEffect(() => {
    setDraft(fields[step]);
  }, [step, fields]);

  const isLast = step === ReportDraftDomainModel.ReportDraftStep.FINAL;

  const onContinue = useCallback(() => {
    dispatch(reportDraftSlice.actions.submitStepContent(draft));
  }, [dispatch, draft]);

  const onBack = useCallback(() => {
    if (step <= ReportDraftDomainModel.ReportDraftStep.META) return;
    const prev = (step - 1) as ReportDraftDomainModel.ReportDraftStep;
    dispatch(reportDraftSlice.actions.setStep(prev));
  }, [dispatch, step]);

  return (
    <>
      <textarea
        className="min-h-[160px] rounded-md border border-form-border bg-form-surface p-3 text-form-text placeholder:text-form-placeholder focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40"
        value={draft}
        placeholder="Contenu de l’étape…"
        onChange={(e) => setDraft(e.target.value)}
        aria-label={label}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-md border border-form-border bg-form-surface px-4 py-2 text-form-text-muted hover:bg-form-overlay disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onBack}
          disabled={step === ReportDraftDomainModel.ReportDraftStep.META}
        >
          Retour
        </button>
        <button
          type="button"
          className="rounded-md bg-form-accent px-4 py-2 font-medium text-white hover:bg-form-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent-strong focus-visible:ring-offset-2"
          onClick={onContinue}
        >
          {isLast ? "Terminer" : "Continuer"}
        </button>
        <button
          type="button"
          className="ml-auto rounded-md border border-form-border px-3 py-2 text-sm text-form-text-muted hover:bg-form-overlay"
          onClick={() => {
            dispatch(reportDraftSlice.actions.resetReportDraft());
          }}
        >
          Réinitialiser
        </button>
      </div>
    </>
  );
};
