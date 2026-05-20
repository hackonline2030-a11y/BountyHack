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
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { submitMentorAdvice } from "@modules/report-draft/core/useCase/submit-mentor-advice.usecase";
import { submitStepForReview } from "@modules/report-draft/core/useCase/submit-step-for-review.usecase";
import { isStepValidationReviewerRole } from "@modules/report-draft/core/model/step-validation-reviewer";
import { reviewerRoleFromDraftStep } from "@modules/report-draft/react/wizard/reviewer-role-from-draft";
import {
  canWizardNavigateNext,
  isSuperAdminGlobalRevisionMode,
} from "@modules/report-draft/core/model/super-admin-final-validation";
import { isWizardStepEditable } from "@modules/report-draft/react/wizard/wizard-step-status";
import { useReportDraftStepSave } from "@modules/report-draft/react/hooks/use-report-draft-step-save";
import { useDependencies } from "@modules/app/nextjs/DependencyProvider";
import { useAppDispatch, useAppSelector } from "@store/redux/store";
import { useReportDraftSession } from "@modules/report-draft/react/context/report-draft-session.context";

const DESCRIPTION_STEP = ReportDraftDomainModel.ReportDraftStep.DESCRIPTION;

export const useDescriptionSection = () => {
  const dispatch = useAppDispatch();
  const dependencies = useDependencies();
  const { viewerUserId, isDesignatedStepWriter } = useReportDraftSession();
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
  const submittedBy = viewerUserId;

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
  const [imageUploadByBlocId, setImageUploadByBlocId] = useState<
    Record<string, { status: "uploading" | "error"; message?: string }>
  >({});

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
  const stepEditableByWorkflow = isWizardStepEditable(stepStatus, {
    draft: draftRow,
    globalSubmissions,
  });
  const editable = stepEditableByWorkflow && isDesignatedStepWriter;
  const hidePerStepSubmit = isSuperAdminGlobalRevisionMode(draftRow);
  const canNavigateNext = canWizardNavigateNext(draftRow, stepStatus);
  const transitionBusy = transition.status === "loading";
  const transitionErr =
    transition.status === "error" ? transition.message : null;

  const { saveDraft, persistThen, hasUnsavedChanges } = useReportDraftStepSave({
    draftId: currentDraftId,
    step: DESCRIPTION_STEP,
    localPayload: draft,
    persistedPayload: persistedDescription,
    canSave: editable,
  });

  const derivedVector = useMemo(() => cvssVector(draft), [draft]);
  const derivedScore = useMemo(() => cvssBaseScore(draft), [draft]);
  const derivedSeverity = useMemo(() => cvssSeverity(derivedScore), [derivedScore]);

  const onNext = useCallback(() => {
    void persistThen(() => {
      if (!canNavigateNext) return;
      dispatch(
        reportDraftSlice.actions.setStep(ReportDraftDomainModel.ReportDraftStep.COLLECTION),
      );
    });
  }, [dispatch, canNavigateNext, persistThen]);

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

  const onUploadSectionImage = useCallback(
    async (blocId: string, file: File) => {
      if (!currentDraftId || !draftRow) return;
      setImageUploadByBlocId((current) => ({
        ...current,
        [blocId]: { status: "uploading" },
      }));

      try {
        const attachment =
          await dependencies.reportDraftRepository.uploadDescriptionSectionImage({
            draftId: currentDraftId,
            file,
          });
        const nextSectionBlocs = draft.sectionBlocs.map((bloc) =>
          bloc.id === blocId ? { ...bloc, attachmentId: attachment.id } : bloc,
        );
        const nextDescription = {
          ...draft,
          sectionBlocs: nextSectionBlocs,
        };
        const nextAttachments = [
          ...draftRow.description.attachments.filter((a) => a.id !== attachment.id),
          attachment,
        ];
        const nextDraftRow: ReportDraftDomainModel.ReportDraft = {
          ...draftRow,
          description: {
            ...draftRow.description,
            payload: nextDescription,
            attachments: nextAttachments,
          },
          updatedAt: new Date().toISOString(),
        };

        await dependencies.reportDraftRepository.save(nextDraftRow);
        setDraft(nextDescription);
        dispatch(reportDraftsSlice.actions.draftUpserted(nextDraftRow));
        setImageUploadByBlocId((current) => {
          const next = { ...current };
          delete next[blocId];
          return next;
        });
      } catch (error) {
        setImageUploadByBlocId((current) => ({
          ...current,
          [blocId]: {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Impossible d’envoyer l’image.",
          },
        }));
      }
    },
    [currentDraftId, dependencies.reportDraftRepository, dispatch, draft, draftRow],
  );

  const onBack = useCallback(() => {
    void persistThen(() => {
      dispatch(
        reportDraftSlice.actions.setStep(ReportDraftDomainModel.ReportDraftStep.META),
      );
    });
  }, [dispatch, persistThen]);

  const onSaveDraft = useCallback(async () => {
    await saveDraft();
  }, [saveDraft]);

  return {
    draft,
    setField,
    isSubmitable,
    stepEditableByWorkflow,
    isDesignatedStepWriter,
    editable,
    hidePerStepSubmit,
    stepStatus,
    canNavigateNext,
    reviewerRole,
    setReviewerRole,
    onNext,
    onSaveDraft,
    hasUnsavedChanges,
    onSubmitForReview,
    onUploadSectionImage,
    onBack,
    transitionBusy,
    transitionErr,
    imageUploadByBlocId,
    descriptionAttachments: draftRow?.description.attachments ?? [],
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
