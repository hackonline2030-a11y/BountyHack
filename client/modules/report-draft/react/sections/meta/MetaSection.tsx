"use client";

import { type FC, type ReactNode } from "react";
import { useMetaSection } from "@modules/report-draft/react/sections/meta/use-meta-section";

/**
 * META step UI. Renders the 11 structured fields described in the report
 * spec. Pure presentation: the presenter hook owns the draft + handlers.
 *
 * The Continue button is gated by `isSubmitable` (eight fields required —
 * see `MetaForm`). Back is disabled because META is the first step.
 */
export const MetaSection: FC = () => {
  const { draft, setField, isSubmitable, onContinue, onReset, catalogs } =
    useMetaSection();

  const scopeSelectValue =
    draft.scopeSlug === "" || catalogs.scopes.includes(draft.scopeSlug)
      ? draft.scopeSlug
      : catalogs.scopeOtherValue;
  const isScopeOther = scopeSelectValue === catalogs.scopeOtherValue;

  const onScopeSelectChange = (value: string) => {
    if (value === catalogs.scopeOtherValue) {
      if (catalogs.scopes.includes(draft.scopeSlug)) {
        setField("scopeSlug", "");
      }
      return;
    }
    setField("scopeSlug", value);
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
      noValidate
    >
      <Field id="meta-bug-type" label="Type de bug" required>
        <select
          id="meta-bug-type"
          value={draft.bugType}
          onChange={(e) => setField("bugType", e.target.value)}
          className={selectClass}
          required
        >
          <option value="">— Sélectionner —</option>
          {catalogs.bugTypes.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="meta-scope" label="Scope (programme YesWeHack)" required>
        <select
          id="meta-scope"
          value={scopeSelectValue}
          onChange={(e) => onScopeSelectChange(e.target.value)}
          className={selectClass}
          required
        >
          <option value="">— Sélectionner —</option>
          {catalogs.scopes.map((slug) => (
            <option key={slug} value={slug}>
              {slug}
            </option>
          ))}
          <option value={catalogs.scopeOtherValue}>Autre…</option>
        </select>
        {isScopeOther && (
          <input
            type="text"
            value={draft.scopeSlug}
            placeholder="slug du programme (ex. dojo-50)"
            onChange={(e) => setField("scopeSlug", e.target.value)}
            className={`${textInputClass} mt-2`}
            aria-label="Scope personnalisé"
          />
        )}
      </Field>

      <Field
        id="meta-endpoint"
        label="Endpoint"
        hint="Verbe HTTP + chemin (ex. GET /?action=...&filename=...&signature=...)"
        required
      >
        <input
          id="meta-endpoint"
          type="text"
          value={draft.endpoint}
          placeholder="GET /?action=…"
          onChange={(e) => setField("endpoint", e.target.value)}
          className={textInputClass}
          required
        />
      </Field>

      <Field
        id="meta-vulnerable-part-category"
        label="Vulnerable part — catégorie"
        hint="Où la vulnérabilité a été exploitée"
        required
      >
        <select
          id="meta-vulnerable-part-category"
          value={draft.vulnerablePartCategory}
          onChange={(e) => setField("vulnerablePartCategory", e.target.value)}
          className={selectClass}
          required
        >
          <option value="">— Sélectionner —</option>
          {catalogs.vulnerableParts.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="meta-vulnerable-part-name"
        label="Vulnerable part — nom"
        hint="Nom du paramètre / header / cookie ciblé (ex. filename)"
        required
      >
        <input
          id="meta-vulnerable-part-name"
          type="text"
          value={draft.vulnerablePartName}
          placeholder="filename"
          onChange={(e) => setField("vulnerablePartName", e.target.value)}
          className={textInputClass}
          required
        />
      </Field>

      <Field
        id="meta-payload"
        label="Payload"
        hint="Comment la protection a été contournée (script, query, code…)"
        required
      >
        <textarea
          id="meta-payload"
          value={draft.payload}
          placeholder="public/%;/my_secret.txt"
          onChange={(e) => setField("payload", e.target.value)}
          className={`${textareaClass} min-h-[120px]`}
          required
        />
      </Field>

      <Field
        id="meta-technical-environment"
        label="Environnement technique"
        hint="OS, navigateur, outils utilisés (ex. burpsuite, curl…)"
        required
      >
        <textarea
          id="meta-technical-environment"
          value={draft.technicalEnvironment}
          placeholder="macOS 14, Firefox 138, Burp Suite Community"
          onChange={(e) => setField("technicalEnvironment", e.target.value)}
          className={`${textareaClass} min-h-[100px]`}
          required
        />
      </Field>

      <Field
        id="meta-application-fingerprint"
        label="Application fingerprint"
        hint="Caractéristiques techniques pertinentes au regard de la faille (optionnel)"
      >
        <textarea
          id="meta-application-fingerprint"
          value={draft.applicationFingerprint}
          placeholder="PHP application (custom file storage), signature-based access…"
          onChange={(e) => setField("applicationFingerprint", e.target.value)}
          className={`${textareaClass} min-h-[80px]`}
        />
      </Field>

      <Field id="meta-cve" label="CVE" hint="Identifiant CVE associé si applicable (optionnel)">
        <input
          id="meta-cve"
          type="text"
          value={draft.cve}
          placeholder="CVE-2024-…"
          onChange={(e) => setField("cve", e.target.value)}
          className={textInputClass}
        />
      </Field>

      <Field
        id="meta-impact"
        label="Impact"
        hint="Concis (ex. Access to unauthorized resources) — optionnel"
      >
        <input
          id="meta-impact"
          type="text"
          value={draft.impact}
          placeholder="Access to unauthorized resources"
          onChange={(e) => setField("impact", e.target.value)}
          className={textInputClass}
        />
      </Field>

      <Field
        id="meta-ips-used"
        label="IPs utilisées"
        hint="IP(s) publiques utilisées pendant le test, séparées par des virgules"
        required
      >
        <input
          id="meta-ips-used"
          type="text"
          value={draft.ipsUsed}
          placeholder="203.0.113.42, 198.51.100.7"
          onChange={(e) => setField("ipsUsed", e.target.value)}
          className={textInputClass}
          required
        />
      </Field>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          className="rounded-md bg-form-overlay px-4 py-2 text-form-text opacity-40"
          disabled
          aria-label="Retour (indisponible — première étape)"
        >
          Retour
        </button>
        <button
          type="submit"
          className="rounded-md bg-form-accent px-4 py-2 font-medium text-form-text hover:bg-form-accent-hover disabled:cursor-not-allowed disabled:bg-form-accent-disabled"
          disabled={!isSubmitable}
        >
          Continuer
        </button>
        <button
          type="button"
          className="ml-auto rounded-md border border-form-border-strong px-3 py-2 text-sm text-form-text-muted hover:bg-form-overlay"
          onClick={onReset}
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
};

const textInputClass =
  "w-full rounded-md border border-form-border bg-form-surface px-3 py-2 text-form-text placeholder:text-form-placeholder focus:border-form-accent-hover focus:outline-none";

const textareaClass =
  "w-full rounded-md border border-form-border bg-form-surface p-3 text-form-text placeholder:text-form-placeholder focus:border-form-accent-hover focus:outline-none";

const selectClass =
  "w-full rounded-md border border-form-border bg-form-surface px-3 py-2 text-form-text focus:border-form-accent-hover focus:outline-none";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

const Field: FC<FieldProps> = ({ id, label, hint, required, children }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-form-text-muted">
      {label}
      {required && <span className="ml-1 text-form-accent-strong">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-form-text-hint">{hint}</p>}
  </div>
);
