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
import {
  DescriptionFactory,
  normalizeDescriptionPayload,
} from "@modules/report-draft/core/model/description.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { submitMentorAdvice } from "@modules/report-draft/core/useCase/submit-mentor-advice.usecase";
import { submitStepForReview } from "@modules/report-draft/core/useCase/submit-step-for-review.usecase";
import { isStepValidationReviewerRole } from "@modules/report-draft/core/model/step-validation-reviewer";
import { reviewerRoleFromDraftStep } from "@modules/report-draft/react/wizard/reviewer-role-from-draft";
import {
  canWizardNavigateNext,
  isSuperAdminGlobalRevisionMode,
} from "@modules/report-draft/core/model/super-admin-final-validation";
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
  const globalSubmissions = useAppSelector((s) =>
    currentDraftId
      ? Object.values(s.reportDrafts.globalSubmissionsById).filter(
          (g) => g.reportDraftId === currentDraftId,
        )
      : [],
  );

  const persistedDescription = draftRow?.description.payload ?? null;
  const stepStatus = draftRow?.description.status ?? "in-progress";
  const metaScopeSlug = draftRow?.meta.payload.scopeSlug ?? "";
  const submittedBy = draftRow?.hunterId ?? "";

  const [reviewerRole, setReviewerRole] =
    useState<ReportDraftDomainModel.ReviewerRole>("quality_checker");

  useEffect(() => {
    const fromDraft = reviewerRoleFromDraftStep(draftRow, DESCRIPTION_STEP);
    setReviewerRole(fromDraft ?? "quality_checker");
  }, [currentDraftId, draftRow]);

  const form = useMemo(() => new DescriptionForm(), []);

  const initialDraft = useMemo<ReportDraftDomainModel.DescriptionFields>(
    () =>
      persistedDescription != null
        ? normalizeDescriptionPayload(persistedDescription)
        : DescriptionFactory.create(),
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
  const editable = isWizardStepEditable(stepStatus, {
    draft: draftRow,
    globalSubmissions,
  });
  const hidePerStepSubmit = isSuperAdminGlobalRevisionMode(draftRow);
  const canNavigateNext = canWizardNavigateNext(draftRow, stepStatus);
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

  const onSubmitForReview = useCallback(async () => {
    if (!currentDraftId || !submittedBy) return;
    if (reviewerRole === "mentor") {
      await dispatch(
        submitMentorAdvice({
          draftId: currentDraftId,
          step: DESCRIPTION_STEP,
          submittedBy,
          payload: draft,
        }),
      );
      return;
    }
    if (!isStepValidationReviewerRole(reviewerRole)) return;
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

  return {
    draft,
    setField,
    isSubmitable,
    editable,
    hidePerStepSubmit,
    stepStatus,
    canNavigateNext,
    reviewerRole,
    setReviewerRole,
    onNext,
    onSubmitForReview,
    onBack,
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
