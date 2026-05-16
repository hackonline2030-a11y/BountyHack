"use client";

import { type FC, type ReactNode } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { useAppSelector } from "@store/redux/store";

/**
 * Pure React previews of the report-draft content.
 *
 * Intentionally rendered with React DOM + Tailwind only — no Puppeteer / Chromium —
 * so opening these views stays cheap and can be triggered freely while a hunter
 * fills the wizard, even with many concurrent users on a small VPS.
 *
 * Step ownership of preview content:
 *  - META         → renders the meta header (title, author, challenge, severity…).
 *  - DESCRIPTION… → each subsequent step renders exactly one section block.
 *
 * Two flavors are exported:
 *  - `ReportDraftPreview` (per-step) — shows only the content owned by the
 *    current wizard step.
 *  - `ReportDraftCumulativePreview` — shows everything filled so far, i.e.
 *    from META up to and including the current step. Future steps are not shown.
 *
 * Content is hardcoded placeholder data for now; a later step will replace
 * `DUMMY_META` / `DUMMY_SECTIONS` with the actual wizard draft fields.
 */
const DUMMY_META = {
  title: "Rapport de sécurité — exemple",
  author: "Hunter Démo",
  challenge: "Demo Challenge — YesWeHack",
  severity: "Critical",
  cvss: "9.1 / 10",
};

type SectionContent = {
  heading: string;
  body: string;
};

/** Steps that own a section block (everything except META). */
type ReportDraftSectionStep = Exclude<
  ReportDraftDomainModel.ReportDraftStep,
  ReportDraftDomainModel.ReportDraftStep.META
>;

const isSectionStep = (
  step: ReportDraftDomainModel.ReportDraftStep,
): step is ReportDraftSectionStep =>
  step !== ReportDraftDomainModel.ReportDraftStep.META;

const DUMMY_SECTIONS: Record<ReportDraftSectionStep, SectionContent> = {
  [ReportDraftDomainModel.ReportDraftStep.DESCRIPTION]: {
    heading: "Description",
    body: "[DONNÉES FACTICES] Brève description de la vulnérabilité observée sur le périmètre cible.",
  },
  [ReportDraftDomainModel.ReportDraftStep.COLLECTION]: {
    heading: "Collecte",
    body: "[DONNÉES FACTICES] Étapes de reconnaissance, endpoints consultés, paramètres testés.",
  },
  [ReportDraftDomainModel.ReportDraftStep.EXPLOITATION]: {
    heading: "Exploitation",
    body: "[DONNÉES FACTICES] Scénario d'exploitation détaillé pas à pas.",
  },
  [ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT]: {
    heading: "Preuve de concept",
    body: "[DONNÉES FACTICES] Requête, payload, réponse — commande reproductible.",
  },
  [ReportDraftDomainModel.ReportDraftStep.RISKS]: {
    heading: "Risques",
    body: "[DONNÉES FACTICES] Impacts confidentialité / intégrité / disponibilité, périmètre affecté.",
  },
  [ReportDraftDomainModel.ReportDraftStep.REMEDIATION]: {
    heading: "Remédiation",
    body: "[DONNÉES FACTICES] Correctifs proposés, contournements temporaires, références.",
  },
  [ReportDraftDomainModel.ReportDraftStep.FINAL]: {
    heading: "Finalisation",
    body: "[DONNÉES FACTICES] Notes finales, références CVE/CWE, remerciements.",
  },
};

const FIRST_STEP = ReportDraftDomainModel.ReportDraftStep.META;

/** All steps from META up to (and including) `currentStep`, in wizard order. */
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
    <h1 className="text-3xl font-bold leading-tight text-slate-900">
      {DUMMY_META.title}
    </h1>
    <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      <div>
        <dt className="inline font-semibold">Auteur : </dt>
        <dd className="inline">{DUMMY_META.author}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Challenge : </dt>
        <dd className="inline">{DUMMY_META.challenge}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Sévérité : </dt>
        <dd className="inline">{DUMMY_META.severity}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">CVSS : </dt>
        <dd className="inline">{DUMMY_META.cvss}</dd>
      </div>
    </dl>
  </header>
);

const PreviewSection: FC<{ section: SectionContent }> = ({ section }) => (
  <section className="mb-6 last:mb-0">
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-700">
      {section.heading}
    </h2>
    <p className="whitespace-pre-line text-sm leading-6 text-slate-800">
      {section.body}
    </p>
  </section>
);

const PreviewPaper: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex w-full justify-center">
    <article
      className="w-full max-w-3xl rounded-md bg-white px-8 py-10 text-slate-900 shadow-xl sm:px-10 sm:py-12"
      aria-label="Aperçu du rapport (données factices)"
    >
      <p className="mb-6 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
        Données factices — sera relié au formulaire plus tard
      </p>
      {children}
    </article>
  </div>
);

export const ReportDraftPreview: FC = () => {
  const step = useAppSelector((s) => s.reportDraft.step);

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

export const ReportDraftCumulativePreview: FC = () => {
  const step = useAppSelector((s) => s.reportDraft.step);
  const sectionStepsToRender = stepsUpTo(step).filter(isSectionStep);

  return (
    <PreviewPaper>
      <PreviewMetaHeader />
      {sectionStepsToRender.map((s) => (
        <PreviewSection key={s} section={DUMMY_SECTIONS[s]} />
      ))}
    </PreviewPaper>
  );
};
