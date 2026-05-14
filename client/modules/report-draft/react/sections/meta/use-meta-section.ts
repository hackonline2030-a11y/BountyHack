"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BUG_TYPES } from "@modules/report-draft/core/catalog/bug-types.catalog";
import {
  SCOPES,
  SCOPE_OTHER_VALUE,
} from "@modules/report-draft/core/catalog/scopes.catalog";
import { VULNERABLE_PARTS } from "@modules/report-draft/core/catalog/vulnerable-parts.catalog";
import { MetaForm } from "@modules/report-draft/core/form/meta.form";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { saveStepPayload } from "@modules/report-draft/core/useCase/save-step-payload.usecase";
import { submitStepForReview } from "@modules/report-draft/core/useCase/submit-step-for-review.usecase";
import { isWizardStepEditable } from "@modules/report-draft/react/wizard/wizard-step-status";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

const META_STEP = ReportDraftDomainModel.ReportDraftStep.META;

/**
 * META : **Enregistrer le brouillon** (persiste sans revue), **Soumettre pour revue**,
 * **Suivant** uniquement après `approved` sur cette étape (validation reviewer).
 */
export const useMetaSection = () => {
  const dispatch = useAppDispatch();
  const currentDraftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draftRow = useAppSelector((s) =>
    currentDraftId ? s.reportDrafts.byId[currentDraftId] : undefined,
  );
  const transition = useAppSelector((s) => s.reportDrafts.transition);

  const persistedMeta = draftRow?.meta.payload ?? null;
  const stepStatus = draftRow?.meta.status ?? "in-progress";
  const submittedBy = draftRow?.hunterId ?? "";

  const [reviewerRole, setReviewerRole] =
    useState<ReportDraftDomainModel.ReviewerRole>("mentor");

  const form = useMemo(() => new MetaForm(), []);

  const initialDraft = useMemo<ReportDraftDomainModel.MetaFields>(
    () => persistedMeta ?? MetaFactory.create(),
    [persistedMeta],
  );
  const [draft, setDraft] = useState<ReportDraftDomainModel.MetaFields>(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const setField = useCallback(
    <K extends keyof ReportDraftDomainModel.MetaFields>(
      key: K,
      value: ReportDraftDomainModel.MetaFields[K],
    ) => {
      setDraft((current) => form.setField(current, key, value));
    },
    [form],
  );

  const isSubmitable = useMemo(() => form.isSubmitable(draft), [form, draft]);
  const editable = isWizardStepEditable(stepStatus);
  const canNavigateNext = stepStatus === "approved";
  const transitionBusy = transition.status === "loading";
  const transitionErr =
    transition.status === "error" ? transition.message : null;

  const onNext = useCallback(() => {
    if (!canNavigateNext) return;
    dispatch(
      reportDraftSlice.actions.setStep(ReportDraftDomainModel.ReportDraftStep.DESCRIPTION),
    );
  }, [dispatch, canNavigateNext]);

  const onSaveDraft = useCallback(async () => {
    if (!currentDraftId || !editable || !isSubmitable) return;
    await dispatch(
      saveStepPayload({ draftId: currentDraftId, step: META_STEP, payload: draft }),
    );
  }, [dispatch, currentDraftId, editable, isSubmitable, draft]);

  const onSubmitForReview = useCallback(async () => {
    if (!currentDraftId || !submittedBy || !isSubmitable) return;
    await dispatch(
      submitStepForReview({
        draftId: currentDraftId,
        step: META_STEP,
        reviewerRole,
        submittedBy,
      }),
    );
  }, [dispatch, currentDraftId, submittedBy, isSubmitable, reviewerRole]);

  const onReset = useCallback(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  return {
    draft,
    setField,
    isSubmitable,
    editable,
    stepStatus,
    canNavigateNext,
    reviewerRole,
    setReviewerRole,
    onNext,
    onSaveDraft,
    onSubmitForReview,
    onReset,
    transitionBusy,
    transitionErr,
    catalogs: {
      bugTypes: BUG_TYPES,
      scopes: SCOPES,
      scopeOtherValue: SCOPE_OTHER_VALUE,
      vulnerableParts: VULNERABLE_PARTS,
    },
  };
};
