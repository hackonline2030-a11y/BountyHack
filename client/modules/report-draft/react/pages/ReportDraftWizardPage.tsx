"use client";

import { type FC, type ReactNode } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { useAppSelector } from "@store/redux/store";
import { DescriptionSection } from "@modules/report-draft/react/sections/description/DescriptionSection";
import { MetaSection } from "@modules/report-draft/react/sections/meta/MetaSection";
import { LongFormReportStepSection } from "@modules/report-draft/react/pages/LongFormReportStepSection";

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

/** Route the current step to its dedicated section. */
const renderStepBody = (
  step: ReportDraftDomainModel.ReportDraftStep,
  label: string,
): ReactNode => {
  switch (step) {
    case ReportDraftDomainModel.ReportDraftStep.META:
      return <MetaSection />;
    case ReportDraftDomainModel.ReportDraftStep.DESCRIPTION:
      return <DescriptionSection />;
    case ReportDraftDomainModel.ReportDraftStep.COLLECTION:
    case ReportDraftDomainModel.ReportDraftStep.EXPLOITATION:
    case ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT:
    case ReportDraftDomainModel.ReportDraftStep.RISKS:
    case ReportDraftDomainModel.ReportDraftStep.REMEDIATION:
    case ReportDraftDomainModel.ReportDraftStep.FINAL:
      return <LongFormReportStepSection step={step} label={label} />;
  }
};

export const ReportDraftWizardPage: FC = () => {
  const step = useAppSelector((s) => s.reportDraft.step);
  const label = STEP_LABELS[step];
  const stepIndex = step + 1;

  return (
    <div className="flex w-full max-w-lg flex-col gap-4 py-2">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-form-text-muted">
          Étape {stepIndex} / {TOTAL_STEPS} — « Soumettre pour revue » enregistre et envoie au
          reviewer. « Suivant » n’est actif qu’après validation par le quality checker (pastille et
          onglet Commentaires).
        </p>
        <h1 className="text-2xl font-semibold text-form-text">{label}</h1>
      </header>
      {renderStepBody(step, label)}
    </div>
  );
};
