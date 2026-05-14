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
          className="rounded-md border border-form-border bg-form-surface px-4 py-2 text-form-text-muted hover:bg-form-overlay"
          onClick={onBack}
        >
          Retour
        </button>
        <button
          type="submit"
          className="rounded-md bg-form-accent px-4 py-2 font-medium text-white hover:bg-form-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-form-accent-disabled"
          disabled={!isSubmitable}
        >
          Continuer
        </button>
        <button
          type="button"
          className="ml-auto rounded-md border border-form-border px-3 py-2 text-sm text-form-text-muted hover:bg-form-overlay"
          onClick={onReset}
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
};

const selectClass =
  "w-full rounded-md border border-form-border bg-form-surface px-3 py-2 text-form-text focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40";

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
    <label htmlFor={id} className="text-sm font-medium text-form-text-muted">
      {label}
      {required && <span className="ml-1 text-form-accent-strong">*</span>}
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
    {hint && <p className="text-xs text-form-text-hint">{hint}</p>}
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
    <div className="rounded-md border border-form-border bg-form-overlay p-3">
      <p className="text-xs uppercase tracking-wider text-form-text-muted">
        Bug characteristics
      </p>
      <div className="mt-1 flex items-center gap-3">
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${tagClass}`}
        >
          {severityLabel}
        </span>
        <span className="text-2xl font-semibold text-form-text">{scoreLabel}</span>
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-form-text-muted">
        CVSS vector
      </p>
      <code className="mt-1 block break-all rounded border border-form-border bg-form-surface px-2 py-1 font-mono text-xs text-form-text">
        {vectorLabel}
      </code>
    </div>
  );
};

/**
 * Severity tag colour pairings — every (bg / text) couple has been picked so the
 * label hits WCAG AAA (≥7:1) on its tinted background. Verified pairings:
 *   rose-900   on rose-100   ≈ 8.43:1
 *   orange-900 on orange-100 ≈ 8.14:1
 *   yellow-900 on yellow-100 ≈ 8.36:1
 *   emerald-900 on emerald-100 ≈ 9.51:1
 *   slate-700  on slate-100  ≈ 9.07:1
 */
const severityClass = (severity: CvssSeverity | null): string => {
  switch (severity) {
    case "Critical":
      return "bg-rose-100 text-rose-900";
    case "High":
      return "bg-orange-100 text-orange-900";
    case "Medium":
      return "bg-yellow-100 text-yellow-900";
    case "Low":
      return "bg-emerald-100 text-emerald-900";
    case "None":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};
