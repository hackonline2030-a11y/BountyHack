"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ATTACK_COMPLEXITY_OPTIONS,
  ATTACK_VECTOR_OPTIONS,
  CIA_IMPACT_OPTIONS,
  PRIVILEGES_REQUIRED_OPTIONS,
  SCOPE_OPTIONS,
  USER_INTERACTION_OPTIONS,
} from "@modules/report-draft/core/catalog/cvss-metrics.catalog";
import {
  cvssBaseScore,
  cvssSeverity,
  cvssVector,
} from "@modules/report-draft/core/cvss/cvss-3.1";
import { DescriptionForm } from "@modules/report-draft/core/form/description.form";
import { DescriptionFactory } from "@modules/report-draft/core/model/description.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { saveStepPayload } from "@modules/report-draft/core/useCase/save-step-payload.usecase";
import { submitStepForReview } from "@modules/report-draft/core/useCase/submit-step-for-review.usecase";
import { reviewerRoleFromDraftStep } from "@modules/report-draft/react/wizard/reviewer-role-from-draft";
import { isWizardStepEditable } from "@modules/report-draft/react/wizard/wizard-step-status";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

const DESCRIPTION_STEP = ReportDraftDomainModel.ReportDraftStep.DESCRIPTION;

export const useDescriptionSection = () => {
  const dispatch = useAppDispatch();
  const currentDraftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draftRow = useAppSelector((s) =>
    currentDraftId ? s.reportDrafts.byId[currentDraftId] : undefined,
  );
  const transition = useAppSelector((s) => s.reportDrafts.transition);

  const persistedDescription = draftRow?.description.payload ?? null;
  const stepStatus = draftRow?.description.status ?? "in-progress";
  const metaScopeSlug = draftRow?.meta.payload.scopeSlug ?? "";
  const submittedBy = draftRow?.hunterId ?? "";

  const [reviewerRole, setReviewerRole] =
    useState<ReportDraftDomainModel.ReviewerRole>("mentor");

  useEffect(() => {
    const fromDraft = reviewerRoleFromDraftStep(draftRow, DESCRIPTION_STEP);
    setReviewerRole(fromDraft ?? "mentor");
  }, [currentDraftId, draftRow]);

  const form = useMemo(() => new DescriptionForm(), []);

  const initialDraft = useMemo<ReportDraftDomainModel.DescriptionFields>(
    () => persistedDescription ?? DescriptionFactory.create(),
    [persistedDescription],
  );
  const [draft, setDraft] =
    useState<ReportDraftDomainModel.DescriptionFields>(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const setField = useCallback(
    <K extends keyof ReportDraftDomainModel.DescriptionFields>(
      key: K,
      value: ReportDraftDomainModel.DescriptionFields[K],
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

  const derivedVector = useMemo(() => cvssVector(draft), [draft]);
  const derivedScore = useMemo(() => cvssBaseScore(draft), [draft]);
  const derivedSeverity = useMemo(() => cvssSeverity(derivedScore), [derivedScore]);

  const onNext = useCallback(() => {
    if (!canNavigateNext) return;
    dispatch(
      reportDraftSlice.actions.setStep(ReportDraftDomainModel.ReportDraftStep.COLLECTION),
    );
  }, [dispatch, canNavigateNext]);

  const onSaveDraft = useCallback(async () => {
    if (!currentDraftId || !editable) return;
    await dispatch(
      saveStepPayload({
        draftId: currentDraftId,
        step: DESCRIPTION_STEP,
        payload: draft,
      }),
    );
  }, [dispatch, currentDraftId, editable, draft]);

  const onSubmitForReview = useCallback(async () => {
    if (!currentDraftId || !submittedBy) return;
    await dispatch(
      submitStepForReview({
        draftId: currentDraftId,
        step: DESCRIPTION_STEP,
        reviewerRole,
        submittedBy,
        payload: draft,
      }),
    );
  }, [dispatch, currentDraftId, submittedBy, reviewerRole, draft]);

  const onBack = useCallback(() => {
    dispatch(
      reportDraftSlice.actions.setStep(ReportDraftDomainModel.ReportDraftStep.META),
    );
  }, [dispatch]);

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
    onBack,
    onReset,
    transitionBusy,
    transitionErr,
    derived: {
      vector: derivedVector,
      score: derivedScore,
      severity: derivedSeverity,
    },
    metaScopeSlug,
    catalogs: {
      attackVector: ATTACK_VECTOR_OPTIONS,
      attackComplexity: ATTACK_COMPLEXITY_OPTIONS,
      privilegesRequired: PRIVILEGES_REQUIRED_OPTIONS,
      userInteraction: USER_INTERACTION_OPTIONS,
      scope: SCOPE_OPTIONS,
      ciaImpact: CIA_IMPACT_OPTIONS,
    },
  };
};
