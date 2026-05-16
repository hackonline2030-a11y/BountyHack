"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { longFormFormForStep } from "@modules/report-draft/core/form/long-form-steps.form";
import { normalizeLongFormPayload } from "@modules/report-draft/core/model/long-form-steps.factory";
import type { LongFormWizardStep } from "@modules/report-draft/core/model/long-form-steps.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { saveStepPayload } from "@modules/report-draft/core/useCase/save-step-payload.usecase";
import { submitStepForReview } from "@modules/report-draft/core/useCase/submit-step-for-review.usecase";
import { reviewerRoleFromDraftStep } from "@modules/report-draft/react/wizard/reviewer-role-from-draft";
import { isWizardStepEditable } from "@modules/report-draft/react/wizard/wizard-step-status";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

const Step = ReportDraftDomainModel.ReportDraftStep;

const FIELD_LABELS_FR: Record<LongFormWizardStep, Record<string, string>> = {
  [Step.COLLECTION]: {
    hypothesis: "Hypothèse de travail",
    reconNarrative: "Collecte et reconnaissance",
    endpointsAndParameters: "Endpoints, paramètres et entrées observés",
    evidenceSummary: "Synthèse des éléments collectés",
  },
  [Step.EXPLOITATION]: {
    prerequisites: "Prérequis (auth, rôle, configuration…)",
    attackPath: "Chemin d’attaque",
    exploitationNarrative: "Scénario d’exploitation",
    impactIfExploited: "Impact si exploité",
  },
  [Step.PROOF_OF_CONCEPT]: {
    environment: "Environnement de test",
    stepsToReproduce: "Étapes de reproduction",
    proofArtifactsDescription: "Requêtes, payloads, captures (texte)",
    expectedBehavior: "Comportement attendu vs observé",
  },
  [Step.RISKS]: {
    confidentiality: "Risque pour la confidentialité",
    integrity: "Risque pour l’intégrité",
    availability: "Risque pour la disponibilité",
    overallRiskStatement: "Synthèse du risque global",
  },
  [Step.REMEDIATION]: {
    shortTermMitigation: "Atténuation court terme",
    longTermFix: "Correctif durable",
    verificationSteps: "Vérification après correctif",
  },
  [Step.FINAL]: {
    conclusion: "Conclusion",
    references: "Références (CVE, CWE, liens…)",
    bugBountyNotes: "Notes finales / chaîne de bugs",
  },
};

type Props = {
  step: LongFormWizardStep;
  label: string;
};

/**
 * Étapes structurées (COLLECTION → FINAL). Brouillon, soumission et « Suivant »
 * suivent la même machine d’état que META / DESCRIPTION.
 */
export const LongFormReportStepSection: FC<Props> = ({ step, label }) => {
  const dispatch = useAppDispatch();
  const currentDraftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draftRow = useAppSelector((s) =>
    currentDraftId ? s.reportDrafts.byId[currentDraftId] : undefined,
  );
  const transition = useAppSelector((s) => s.reportDrafts.transition);

  const stateKey = useMemo(() => reportDraftStepToStateKey(step), [step]);
  const rawPayload = draftRow?.[stateKey]?.payload;
  const persistedPayload = useMemo(
    () => normalizeLongFormPayload(step, rawPayload),
    [step, rawPayload],
  );

  const stepStatus = draftRow?.[stateKey]?.status ?? "in-progress";

  const submittedBy = draftRow?.hunterId ?? "";
  const [reviewerRole, setReviewerRole] =
    useState<ReportDraftDomainModel.ReviewerRole>("mentor");

  useEffect(() => {
    const fromDraft = reviewerRoleFromDraftStep(draftRow, step);
    setReviewerRole(fromDraft ?? "mentor");
  }, [currentDraftId, draftRow, step]);

  const form = useMemo(() => longFormFormForStep(step), [step]);
  const [draft, setDraft] = useState<Record<string, string>>(persistedPayload);

  useEffect(() => {
    setDraft(persistedPayload);
  }, [step, persistedPayload]);

  const editable = isWizardStepEditable(stepStatus);
  const canNavigateNext = stepStatus === "approved";
  const isLast = step === Step.FINAL;

  const onNext = useCallback(() => {
    if (isLast || !canNavigateNext) return;
    const next = (step + 1) as ReportDraftDomainModel.ReportDraftStep;
    dispatch(reportDraftSlice.actions.setStep(next));
  }, [dispatch, step, isLast, canNavigateNext]);

  const onSaveDraft = useCallback(async () => {
    if (!currentDraftId || !editable) return;
    await dispatch(
      saveStepPayload({ draftId: currentDraftId, step, payload: draft }),
    );
  }, [dispatch, currentDraftId, editable, draft, step]);

  const submitForReview = useCallback(async () => {
    if (!currentDraftId || !submittedBy) return;
    await dispatch(
      submitStepForReview({
        draftId: currentDraftId,
        step,
        reviewerRole,
        submittedBy,
        payload: draft,
      }),
    );
  }, [dispatch, currentDraftId, step, reviewerRole, submittedBy, draft]);

  const onBack = useCallback(() => {
    const prev = (step - 1) as ReportDraftDomainModel.ReportDraftStep;
    dispatch(reportDraftSlice.actions.setStep(prev));
  }, [dispatch, step]);

  const transitionBusy = transition.status === "loading";
  const transitionErr =
    transition.status === "error" ? transition.message : null;

  const labelsForStep = FIELD_LABELS_FR[step];

  return (
    <>
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
          Cette étape est en attente de revue ou figée. Onglet « Commentaires » pour les retours.
          {!isLast ? (
            <>
              {" "}
              « Suivant » n’est actif qu’après validation (« Validée »).
            </>
          ) : null}
        </p>
      ) : null}
      {isLast && canNavigateNext ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-950">
          Dernière étape validée. Tu peux encore enrichir le brouillon si le workflow le permet, ou
          quitter le wizard.
        </p>
      ) : null}

      <div className="flex flex-col gap-4" aria-label={label}>
        {form.keys().map((fieldKey) => (
          <label key={fieldKey} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-form-text">
              {labelsForStep[fieldKey] ?? fieldKey}
            </span>
            <textarea
              className="min-h-[96px] rounded-md border border-form-border bg-form-surface p-3 text-form-text placeholder:text-form-placeholder focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              value={draft[fieldKey] ?? ""}
              placeholder="…"
              onChange={(e) => setDraft(form.setField(draft, fieldKey, e.target.value))}
              disabled={!editable}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-form-text-muted" htmlFor={`reviewer-${step}`}>
          Revue demandée à
        </label>
        <select
          id={`reviewer-${step}`}
          className="w-full max-w-xs rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm text-form-text"
          value={reviewerRole}
          onChange={(e) =>
            setReviewerRole(e.target.value as ReportDraftDomainModel.ReviewerRole)
          }
          disabled={!editable || transitionBusy}
        >
          <option value="mentor">Mentor</option>
          <option value="quality_checker">Quality checker</option>
          <option value="hunter">Hunter (pair review)</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-md border border-form-border bg-form-surface px-4 py-2 text-form-text-muted hover:bg-form-overlay disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onBack}
          disabled={transitionBusy}
        >
          Retour
        </button>
        <button
          type="button"
          className="rounded-md border border-form-border bg-form-surface px-4 py-2 font-medium text-form-text hover:bg-form-overlay disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void onSaveDraft()}
          disabled={transitionBusy || !editable}
        >
          Enregistrer le brouillon
        </button>
        {!isLast ? (
          <button
            type="button"
            className="rounded-md border border-form-border bg-form-surface px-4 py-2 font-medium text-form-text hover:bg-form-overlay disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onNext}
            disabled={transitionBusy || !canNavigateNext}
            title={
              canNavigateNext
                ? undefined
                : "Disponible uniquement après validation de cette étape par le reviewer."
            }
          >
            Suivant
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-md bg-form-accent px-4 py-2 font-medium text-white hover:bg-form-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-form-accent-disabled"
          onClick={() => void submitForReview()}
          disabled={transitionBusy || !editable || !submittedBy}
        >
          Soumettre cette étape pour revue
        </button>
        <button
          type="button"
          className="ml-auto rounded-md border border-form-border px-3 py-2 text-sm text-form-text-muted hover:bg-form-overlay"
          onClick={() => setDraft(persistedPayload)}
          disabled={transitionBusy || !editable}
        >
          Réinitialiser
        </button>
      </div>
    </>
  );
};
