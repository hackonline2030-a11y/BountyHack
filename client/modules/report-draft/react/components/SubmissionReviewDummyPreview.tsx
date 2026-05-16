"use client";

import { type FC, type ReactNode } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";

const DUMMY_META = {
  title: "Rapport de sécurité — exemple (revue QC)",
  author: "Hunter",
  challenge: "Challenge",
  severity: "—",
  cvss: "—",
};

type SectionContent = { heading: string; body: string };

type SectionStep = Exclude<
  ReportDraftDomainModel.ReportDraftStep,
  ReportDraftDomainModel.ReportDraftStep.META
>;

const isSectionStep = (
  step: ReportDraftDomainModel.ReportDraftStep,
): step is SectionStep => step !== ReportDraftDomainModel.ReportDraftStep.META;

const DUMMY_SECTIONS: Record<SectionStep, SectionContent> = {
  [ReportDraftDomainModel.ReportDraftStep.DESCRIPTION]: {
    heading: "Description",
    body: "[APERÇU FACTICE] Contenu soumis par le hunter pour cette étape.",
  },
  [ReportDraftDomainModel.ReportDraftStep.COLLECTION]: {
    heading: "Collecte",
    body: "[APERÇU FACTICE] Collecte.",
  },
  [ReportDraftDomainModel.ReportDraftStep.EXPLOITATION]: {
    heading: "Exploitation",
    body: "[APERÇU FACTICE] Exploitation.",
  },
  [ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT]: {
    heading: "Preuve de concept",
    body: "[APERÇU FACTICE] PoC.",
  },
  [ReportDraftDomainModel.ReportDraftStep.RISKS]: {
    heading: "Risques",
    body: "[APERÇU FACTICE] Risques.",
  },
  [ReportDraftDomainModel.ReportDraftStep.REMEDIATION]: {
    heading: "Remédiation",
    body: "[APERÇU FACTICE] Remédiation.",
  },
  [ReportDraftDomainModel.ReportDraftStep.FINAL]: {
    heading: "Finalisation",
    body: "[APERÇU FACTICE] Finalisation.",
  },
};

const FIRST_STEP = ReportDraftDomainModel.ReportDraftStep.META;

const stepsUpTo = (
  currentStep: ReportDraftDomainModel.ReportDraftStep,
): ReportDraftDomainModel.ReportDraftStep[] => {
  const result: ReportDraftDomainModel.ReportDraftStep[] = [];
  for (let s = FIRST_STEP; s <= currentStep; s++) {
    result.push(s as ReportDraftDomainModel.ReportDraftStep);
  }
  return result;
};

const PreviewMetaHeader: FC = () => (
  <header className="mb-8 border-b border-slate-200 pb-6">
    <h1 className="text-3xl font-bold leading-tight text-slate-900">{DUMMY_META.title}</h1>
    <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      <div>
        <dt className="inline font-semibold">Auteur : </dt>
        <dd className="inline">{DUMMY_META.author}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Challenge : </dt>
        <dd className="inline">{DUMMY_META.challenge}</dd>
      </div>
    </dl>
  </header>
);

const PreviewSection: FC<{ section: SectionContent }> = ({ section }) => (
  <section className="mb-6 last:mb-0">
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-700">
      {section.heading}
    </h2>
    <p className="whitespace-pre-line text-sm leading-6 text-slate-800">{section.body}</p>
  </section>
);

const PreviewPaper: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex w-full justify-center">
    <article
      className="w-full max-w-3xl rounded-md bg-white px-8 py-10 text-slate-900 shadow-xl sm:px-10 sm:py-12"
      aria-label="Aperçu du rapport (données factices)"
    >
      <p className="mb-6 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
        Données factices — relié au formulaire plus tard
      </p>
      {children}
    </article>
  </div>
);

type StepPreviewProps = {
  step: ReportDraftDomainModel.ReportDraftStep;
};

export const SubmissionReviewStepDummyPreview: FC<StepPreviewProps> = ({ step }) => {
  if (!isSectionStep(step)) {
    return (
      <PreviewPaper>
        <PreviewMetaHeader />
      </PreviewPaper>
    );
  }

  return (
    <PreviewPaper>
      <PreviewSection section={DUMMY_SECTIONS[step]} />
    </PreviewPaper>
  );
};

type CumulativePreviewProps = {
  submissionStep: ReportDraftDomainModel.ReportDraftStep;
  draft: ReportDraftDomainModel.ReportDraft;
};

/** Fake cumulative preview: META + sections for approved steps + current submission step. */
export const SubmissionReviewCumulativeDummyPreview: FC<CumulativePreviewProps> = ({
  submissionStep,
  draft,
}) => {
  const sectionSteps = stepsUpTo(submissionStep).filter(isSectionStep).filter((s) => {
    if (s === submissionStep) return true;
    const key = reportDraftStepToStateKey(s);
    const state = draft[key] as ReportDraftDomainModel.StepState<unknown>;
    return state.status === "approved";
  });

  return (
    <PreviewPaper>
      <PreviewMetaHeader />
      {sectionSteps.map((s) => (
        <PreviewSection key={s} section={DUMMY_SECTIONS[s]} />
      ))}
    </PreviewPaper>
  );
};
