"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import { normalizeLongFormPayload } from "@modules/report-draft/core/model/long-form-steps.factory";
import type { LongFormWizardStep } from "@modules/report-draft/core/model/long-form-steps.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { submitMentorAdvice } from "@modules/report-draft/core/useCase/submit-mentor-advice.usecase";
import { submitStepForReview } from "@modules/report-draft/core/useCase/submit-step-for-review.usecase";
import { isStepValidationReviewerRole } from "@modules/report-draft/core/model/step-validation-reviewer";
import { ReportDraftFinalStepStatusBanner } from "@modules/report-draft/react/components/ReportDraftFinalStepStatusBanner";
import { ReportDraftGlobalSubmitButton } from "@modules/report-draft/react/components/ReportDraftGlobalSubmitButton";
import { SectionBlocRepeater } from "@modules/report-draft/react/components/section-bloc/SectionBlocRepeater";
import { useStepSectionImageUpload } from "@modules/report-draft/react/hooks/use-step-section-image-upload";
import { LAST_HUNTER_WIZARD_STEP } from "@modules/report-draft/core/model/hunter-wizard-steps";
import { reviewerRoleFromDraftStep } from "@modules/report-draft/react/wizard/reviewer-role-from-draft";
import {
  canWizardNavigateNext,
  isSuperAdminGlobalRevisionMode,
} from "@modules/report-draft/core/model/super-admin-final-validation";
import { isWizardStepEditable } from "@modules/report-draft/react/wizard/wizard-step-status";
import { useAppDispatch, useAppSelector } from "@store/redux/store";
import { useReportDraftSession } from "@modules/report-draft/react/context/report-draft-session.context";

const Step = ReportDraftDomainModel.ReportDraftStep;

type Props = {
  step: LongFormWizardStep;
  label: string;
};

/**
 * Long-form wizard steps (COLLECTION → REMEDIATION) — section blocs with image upload.
 */
export const LongFormReportStepSection: FC<Props> = ({ step, label }) => {
  const { t } = useT("myReports");
  const dispatch = useAppDispatch();
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

  const stateKey = useMemo(() => reportDraftStepToStateKey(step), [step]);
  const rawPayload = draftRow?.[stateKey]?.payload;
  const persistedPayload = useMemo(
    () => normalizeLongFormPayload(step, rawPayload),
    [step, rawPayload],
  );

  const stepStatus = draftRow?.[stateKey]?.status ?? "in-progress";

  const submittedBy = viewerUserId;
  const [reviewerRole, setReviewerRole] =
    useState<ReportDraftDomainModel.ReviewerRole>("quality_checker");

  useEffect(() => {
    const fromDraft = reviewerRoleFromDraftStep(draftRow, step);
    setReviewerRole(fromDraft ?? "quality_checker");
  }, [currentDraftId, draftRow, step]);

  const [draft, setDraft] =
    useState<ReportDraftDomainModel.LongFormStepPayload>(persistedPayload);

  useEffect(() => {
    setDraft(persistedPayload);
  }, [step, persistedPayload]);

  const stepEditableByWorkflow = isWizardStepEditable(stepStatus, {
    draft: draftRow,
    globalSubmissions,
  });
  const editable = stepEditableByWorkflow && isDesignatedStepWriter;
  const hidePerStepSubmit = isSuperAdminGlobalRevisionMode(draftRow);
  const canNavigateNext = canWizardNavigateNext(draftRow, stepStatus);
  const isLast = step === LAST_HUNTER_WIZARD_STEP;

  const { stepAttachments, imageUploadByBlocId, onUploadSectionImage } =
    useStepSectionImageUpload({
      step,
      draftPayload: draft,
      setDraftPayload: setDraft,
    });

  const onNext = useCallback(() => {
    if (isLast || !canNavigateNext) return;
    const next = (step + 1) as ReportDraftDomainModel.ReportDraftStep;
    dispatch(reportDraftSlice.actions.setStep(next));
  }, [dispatch, step, isLast, canNavigateNext]);

  const submitForReview = useCallback(async () => {
    if (!currentDraftId || !submittedBy) return;
    if (reviewerRole === "mentor") {
      await dispatch(
        submitMentorAdvice({
          draftId: currentDraftId,
          step,
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
      {!isDesignatedStepWriter && stepEditableByWorkflow ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950">
          {t("myReports.workspace.hunterWriter.coHunterReadOnly")}
        </p>
      ) : null}
      {!editable ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950">
          Cette étape est en attente de revue ou figée. Onglet « Commentaires » pour les retours.
          {!isLast ? (
            <>
              {" "}
              « Suivant » n’est actif qu’après validation par le quality checker (« Validée »).
            </>
          ) : null}
        </p>
      ) : null}
      <ReportDraftFinalStepStatusBanner
        draft={draftRow}
        isLastStep={isLast}
        stepApproved={stepStatus === "approved" || canNavigateNext}
      />

      <div aria-label={label}>
        <SectionBlocRepeater
          blocs={draft.sectionBlocs}
          editable={editable}
          attachments={stepAttachments}
          imageUploadByBlocId={imageUploadByBlocId}
          onImageUpload={editable ? onUploadSectionImage : undefined}
          onChange={(sectionBlocs) => setDraft({ sectionBlocs })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-form-text-muted">
          Seule la validation par le quality checker active le bouton « Suivant ». L’avis mentor est
          facultatif et n’empêche pas de continuer sur cette étape.
        </p>
        <label className="text-sm font-medium text-form-text-muted" htmlFor={`reviewer-${step}`}>
          Soumettre pour revue à
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
          <option value="quality_checker">Quality checker</option>
          <option value="mentor">Mentor</option>
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
        {!isLast ? (
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
        ) : null}
        {!hidePerStepSubmit ? (
          <button
            type="button"
            className="rounded-md bg-form-accent px-4 py-2 font-medium text-white hover:bg-form-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-form-accent-disabled"
            onClick={() => void submitForReview()}
            disabled={transitionBusy || !editable || !submittedBy}
          >
            Soumettre cette étape pour revue
          </button>
        ) : null}
        <ReportDraftGlobalSubmitButton currentStep={step} currentPayload={draft} />
      </div>
    </>
  );
};
