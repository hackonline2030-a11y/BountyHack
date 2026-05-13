"use client";

import { type FC, type ReactNode } from "react";
import type { CvssMetricOption } from "@modules/report-draft/core/catalog/cvss-metrics.catalog";
import type { CvssSeverity } from "@modules/report-draft/core/cvss/cvss-3.1";
import { useDescriptionSection } from "@modules/report-draft/react/sections/description/use-description-section";

/**
 * DESCRIPTION step UI. The 8 CVSS 3.1 base metric selects, plus a derived
 * read-only display showing the live CVSS vector, base score, and
 * qualitative severity tag.
 *
 * Submit gate: AV + PR only (per the spec). The derived vector/score only
 * compute once all 8 metrics are filled — until then the display shows
 * "N/A" to avoid emitting a half-valid CVSS string.
 */
export const DescriptionSection: FC = () => {
  const {
    draft,
    setField,
    isSubmitable,
    onContinue,
    onBack,
    onReset,
    derived,
    metaScopeSlug,
    catalogs,
  } = useDescriptionSection();

  const scopeHint =
    metaScopeSlug !== ""
      ? `« Changed » si l'exploit a touché un système hors du programme « ${metaScopeSlug} » ; sinon « Unchanged ».`
      : "« Changed » si l'exploit a touché un système hors du programme déclaré ; sinon « Unchanged ».";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
      noValidate
    >
      <DerivedPanel
        vector={derived.vector}
        score={derived.score}
        severity={derived.severity}
      />

      <MetricField
        id="desc-attack-vector"
        label="Attack Vector (AV)"
        hint="Comment l'exploit est-il déclenché ?"
        required
        value={draft.attackVector}
        options={catalogs.attackVector}
        onChange={(v) => setField("attackVector", v)}
      />

      <MetricField
        id="desc-privileges-required"
        label="Privileges Required (PR)"
        hint="Privilèges nécessaires sur la cible pour exploiter."
        required
        value={draft.privilegesRequired}
        options={catalogs.privilegesRequired}
        onChange={(v) => setField("privilegesRequired", v)}
      />

      <MetricField
        id="desc-attack-complexity"
        label="Attack Complexity (AC)"
        hint="Conditions hors du contrôle de l'attaquant (Low = aucune)."
        value={draft.attackComplexity}
        options={catalogs.attackComplexity}
        onChange={(v) => setField("attackComplexity", v)}
      />

      <MetricField
        id="desc-user-interaction"
        label="User Interaction (UI)"
        hint="Une action utilisateur est-elle requise ?"
        value={draft.userInteraction}
        options={catalogs.userInteraction}
        onChange={(v) => setField("userInteraction", v)}
      />

      <MetricField
        id="desc-scope"
        label="Scope (S)"
        hint={scopeHint}
        value={draft.scope}
        options={catalogs.scope}
        onChange={(v) => setField("scope", v)}
      />

      <MetricField
        id="desc-confidentiality"
        label="Confidentiality (C)"
        hint="Impact sur la confidentialité des données accessibles."
        value={draft.confidentiality}
        options={catalogs.ciaImpact}
        onChange={(v) => setField("confidentiality", v)}
      />

      <MetricField
        id="desc-integrity"
        label="Integrity (I)"
        hint="Impact sur l'intégrité des données ou systèmes."
        value={draft.integrity}
        options={catalogs.ciaImpact}
        onChange={(v) => setField("integrity", v)}
      />

      <MetricField
        id="desc-availability"
        label="Availability (A)"
        hint="Impact sur la disponibilité du service ou des ressources."
        value={draft.availability}
        options={catalogs.ciaImpact}
        onChange={(v) => setField("availability", v)}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
          onClick={onBack}
        >
          Retour
        </button>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-600/40"
          disabled={!isSubmitable}
        >
          Continuer
        </button>
        <button
          type="button"
          className="ml-auto rounded-md border border-white/30 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          onClick={onReset}
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
};

const selectClass =
  "w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none";

type MetricFieldProps = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  value: string;
  options: ReadonlyArray<CvssMetricOption>;
  onChange: (value: string) => void;
};

const MetricField: FC<MetricFieldProps> = ({
  id,
  label,
  hint,
  required,
  value,
  options,
  onChange,
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-white/80">
      {label}
      {required && <span className="ml-1 text-emerald-400">*</span>}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClass}
      required={required}
    >
      <option value="">— Sélectionner —</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
    {hint && <p className="text-xs text-white/50">{hint}</p>}
  </div>
);

type DerivedPanelProps = {
  vector: string | null;
  score: number | null;
  severity: CvssSeverity | null;
};

/**
 * Read-only summary of the live CVSS computation. Shows `N/A` until all 8
 * metrics are set (only then is the score well-defined). The severity tag
 * is colour-coded purely for visual triage; the numeric score is the
 * authoritative value.
 */
const DerivedPanel: FC<DerivedPanelProps> = ({ vector, score, severity }) => {
  const tagClass = severityClass(severity);
  const scoreLabel = score === null ? "—" : score.toFixed(1);
  const severityLabel = severity ?? "N/A";
  const vectorLabel = vector ?? "N/A — sélectionnez les 8 métriques pour générer le vecteur.";

  return (
    <div className="rounded-md border border-white/20 bg-black/30 p-3">
      <p className="text-xs uppercase tracking-wider text-white/60">
        Bug characteristics
      </p>
      <div className="mt-1 flex items-center gap-3">
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${tagClass}`}
        >
          {severityLabel}
        </span>
        <span className="text-2xl font-semibold text-white">{scoreLabel}</span>
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-white/60">
        CVSS vector
      </p>
      <code className="mt-1 block break-all rounded bg-black/40 px-2 py-1 font-mono text-xs text-white/90">
        {vectorLabel}
      </code>
    </div>
  );
};

const severityClass = (severity: CvssSeverity | null): string => {
  switch (severity) {
    case "Critical":
      return "bg-rose-600/30 text-rose-200";
    case "High":
      return "bg-orange-500/30 text-orange-200";
    case "Medium":
      return "bg-yellow-500/30 text-yellow-200";
    case "Low":
      return "bg-emerald-500/30 text-emerald-200";
    case "None":
      return "bg-white/10 text-white/70";
    default:
      return "bg-white/10 text-white/50";
  }
};
