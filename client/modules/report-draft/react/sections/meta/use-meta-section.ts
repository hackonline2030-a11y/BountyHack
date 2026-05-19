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

const META_STEP = ReportDraftDomainModel.ReportDraftStep.META;

/**
 * META : **Soumettre pour revue** (persiste le payload à la soumission),
 * **Suivant** uniquement après `approved` sur cette étape (validation QC).
 */
export const useMetaSection = () => {
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

  const persistedMeta = draftRow?.meta.payload ?? null;
  const stepStatus = draftRow?.meta.status ?? "in-progress";
  const submittedBy = draftRow?.hunterId ?? "";

  const [reviewerRole, setReviewerRole] =
    useState<ReportDraftDomainModel.ReviewerRole>("quality_checker");

  useEffect(() => {
    const fromDraft = reviewerRoleFromDraftStep(draftRow, META_STEP);
    setReviewerRole(fromDraft ?? "quality_checker");
  }, [currentDraftId, draftRow]);

  const form = useMemo(() => new MetaForm(), []);

  const initialDraft = useMemo<ReportDraftDomainModel.MetaFields>(
    () => MetaFactory.create(persistedMeta ?? undefined),
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
  const editable = isWizardStepEditable(stepStatus, {
    draft: draftRow,
    globalSubmissions,
  });
  const hidePerStepSubmit = isSuperAdminGlobalRevisionMode(draftRow);
  const canNavigateNext = canWizardNavigateNext(draftRow, stepStatus);
  const transitionBusy = transition.status === "loading";
  const transitionErr =
    transition.status === "error" ? transition.message : null;

  const onNext = useCallback(() => {
    if (!canNavigateNext) return;
    dispatch(
      reportDraftSlice.actions.setStep(ReportDraftDomainModel.ReportDraftStep.DESCRIPTION),
    );
  }, [dispatch, canNavigateNext]);

  const onSubmitForReview = useCallback(async () => {
    if (!currentDraftId || !submittedBy) return;
    if (reviewerRole === "mentor") {
      await dispatch(
        submitMentorAdvice({
          draftId: currentDraftId,
          step: META_STEP,
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
        step: META_STEP,
        reviewerRole,
        submittedBy,
        payload: draft,
      }),
    );
  }, [dispatch, currentDraftId, submittedBy, reviewerRole, draft]);

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
