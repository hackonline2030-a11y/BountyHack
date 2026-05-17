"use client";

import { type FC, type ReactNode } from "react";
import type { CvssMetricOption } from "@modules/report-draft/core/catalog/cvss-metrics.catalog";
import type { CvssSeverity } from "@modules/report-draft/core/cvss/cvss-3.1";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftGlobalSubmitButton } from "@modules/report-draft/react/components/ReportDraftGlobalSubmitButton";
import { useDescriptionSection } from "@modules/report-draft/react/sections/description/use-description-section";

const DESCRIPTION_STEP = ReportDraftDomainModel.ReportDraftStep.DESCRIPTION;

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
    editable,
    hidePerStepSubmit,
    canNavigateNext,
    reviewerRole,
    setReviewerRole,
    onNext,
    onSubmitForReview,
    onBack,
    transitionBusy,
    transitionErr,
    derived,
    metaScopeSlug,
    catalogs,
  } = useDescriptionSection();

  const lockedOff = !editable || transitionBusy;

  const scopeHint =
    metaScopeSlug !== ""
      ? `« Changed » si l'exploit a touché un système hors du programme « ${metaScopeSlug} » ; sinon « Unchanged ».`
      : "« Changed » si l'exploit a touché un système hors du programme déclaré ; sinon « Unchanged ».";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
      }}
      noValidate
    >
      {transitionErr ? (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900"
        >
          {transitionErr}
        </p>
      ) : null}
      {!editable ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950">
          Cette étape est en attente de revue ou figée. Voir l’onglet « Commentaires ». « Suivant »
          n’est actif qu’après validation par le quality checker (« Validée »).
        </p>
      ) : null}
      <DerivedPanel
        vector={derived.vector}
        score={derived.score}
        severity={derived.severity}
      />

      <MetricField
        id="desc-attack-vector"
        label="Attack Vector (AV)"
        hint="Comment l'exploit est-il déclenché ?"
        disabled={lockedOff}
        value={draft.attackVector}
        options={catalogs.attackVector}
        onChange={(v) => setField("attackVector", v)}
      />

      <MetricField
        id="desc-privileges-required"
        label="Privileges Required (PR)"
        hint="Privilèges nécessaires sur la cible pour exploiter."
        disabled={lockedOff}
        value={draft.privilegesRequired}
        options={catalogs.privilegesRequired}
        onChange={(v) => setField("privilegesRequired", v)}
      />

      <MetricField
        id="desc-attack-complexity"
        label="Attack Complexity (AC)"
        hint="Conditions hors du contrôle de l'attaquant (Low = aucune)."
        disabled={lockedOff}
        value={draft.attackComplexity}
        options={catalogs.attackComplexity}
        onChange={(v) => setField("attackComplexity", v)}
      />

      <MetricField
        id="desc-user-interaction"
        label="User Interaction (UI)"
        hint="Une action utilisateur est-elle requise ?"
        disabled={lockedOff}
        value={draft.userInteraction}
        options={catalogs.userInteraction}
        onChange={(v) => setField("userInteraction", v)}
      />

      <MetricField
        id="desc-scope"
        label="Scope (S)"
        hint={scopeHint}
        disabled={lockedOff}
        value={draft.scope}
        options={catalogs.scope}
        onChange={(v) => setField("scope", v)}
      />

      <MetricField
        id="desc-confidentiality"
        label="Confidentiality (C)"
        hint="Impact sur la confidentialité des données accessibles."
        disabled={lockedOff}
        value={draft.confidentiality}
        options={catalogs.ciaImpact}
        onChange={(v) => setField("confidentiality", v)}
      />

      <MetricField
        id="desc-integrity"
        label="Integrity (I)"
        hint="Impact sur l'intégrité des données ou systèmes."
        disabled={lockedOff}
        value={draft.integrity}
        options={catalogs.ciaImpact}
        onChange={(v) => setField("integrity", v)}
      />

      <MetricField
        id="desc-availability"
        label="Availability (A)"
        hint="Impact sur la disponibilité du service ou des ressources."
        disabled={lockedOff}
        value={draft.availability}
        options={catalogs.ciaImpact}
        onChange={(v) => setField("availability", v)}
      />

      <div className="flex flex-col gap-2 border-t border-form-border pt-4">
        <p className="text-sm text-form-text-muted">
          Seule la validation par le quality checker active le bouton « Suivant ». L’avis mentor est
          facultatif et n’empêche pas de continuer sur cette étape.
        </p>
        <label className="text-sm font-medium text-form-text-muted" htmlFor="desc-reviewer-role">
          Soumettre pour revue à
        </label>
        <select
          id="desc-reviewer-role"
          className="w-full max-w-xs rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm text-form-text"
          value={reviewerRole}
          onChange={(e) =>
            setReviewerRole(e.target.value as ReportDraftDomainModel.ReviewerRole)
          }
          disabled={lockedOff}
        >
          <option value="quality_checker">Quality checker</option>
          <option value="mentor">Mentor</option>
          <option value="hunter">Hunter (pair review)</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          className="rounded-md border border-form-border bg-form-surface px-4 py-2 text-form-text-muted hover:bg-form-overlay disabled:opacity-50"
          onClick={onBack}
          disabled={transitionBusy}
        >
          Retour
        </button>
        <button
          type="button"
          className="rounded-md border border-form-border bg-form-surface px-4 py-2 font-medium text-form-text hover:bg-form-overlay disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onNext}
          disabled={transitionBusy || !canNavigateNext}
          title={
            canNavigateNext
              ? undefined
              : "Disponible uniquement après validation de cette étape par le quality checker."
          }
        >
          Suivant
        </button>
        {!hidePerStepSubmit ? (
          <button
            type="button"
            className="rounded-md bg-form-accent px-4 py-2 font-medium text-white hover:bg-form-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-form-accent-disabled"
            onClick={() => void onSubmitForReview()}
            disabled={transitionBusy || !editable}
          >
            Soumettre cette étape pour revue
          </button>
        ) : null}
        <ReportDraftGlobalSubmitButton
          currentStep={DESCRIPTION_STEP}
          currentPayload={draft}
        />
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
  disabled?: boolean;
  value: string;
  options: ReadonlyArray<CvssMetricOption>;
  onChange: (value: string) => void;
};

const MetricField: FC<MetricFieldProps> = ({
  id,
  label,
  hint,
  disabled = false,
  value,
  options,
  onChange,
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-form-text-muted">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClass}
      disabled={disabled}
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
