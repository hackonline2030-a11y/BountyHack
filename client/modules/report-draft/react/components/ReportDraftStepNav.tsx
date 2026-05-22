"use client";

import type { FC, ReactNode } from "react";
import { ReportDraftGlobalSubmitButton } from "@modules/report-draft/react/components/ReportDraftGlobalSubmitButton";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  wizardBackClass,
  wizardNextClass,
  wizardSaveDraftClass,
  wizardSubmitClass,
} from "@modules/app/nextjs/components/buttons/button-styles";

type Props = {
  transitionBusy: boolean;
  /** When set, back is clickable; when omitted, back stays disabled (first step). */
  onBack?: () => void;
  onSaveDraft?: () => void | Promise<void>;
  showSaveDraft?: boolean;
  saveDraftLabel?: ReactNode;
  saveDraftTitle?: string;
  showNext?: boolean;
  onNext?: () => void;
  canNavigateNext?: boolean;
  nextTitle?: string;
  hidePerStepSubmit?: boolean;
  onSubmitForReview?: () => void;
  submitDisabled?: boolean;
  submitLabel?: ReactNode;
  currentStep: ReportDraftDomainModel.ReportDraftStep;
  currentPayload: unknown;
  className?: string;
};

export const ReportDraftStepNav: FC<Props> = ({
  transitionBusy,
  onBack,
  onSaveDraft,
  showSaveDraft = false,
  saveDraftLabel = "Enregistrer le brouillon",
  saveDraftTitle,
  showNext = true,
  onNext,
  canNavigateNext = true,
  nextTitle,
  hidePerStepSubmit = false,
  onSubmitForReview,
  submitDisabled = false,
  submitLabel = "Soumettre cette étape pour revue",
  currentStep,
  currentPayload,
  className = "",
}) => (
  <div className={`flex flex-wrap gap-3 pt-2 ${className}`.trim()}>
    <button
      type="button"
      className={wizardBackClass}
      onClick={() => void onBack?.()}
      disabled={transitionBusy || !onBack}
      aria-label={onBack ? undefined : "Retour (indisponible — première étape)"}
    >
      Retour
    </button>
    {showSaveDraft && onSaveDraft ? (
      <button
        type="button"
        className={wizardSaveDraftClass}
        onClick={() => void onSaveDraft()}
        disabled={transitionBusy}
        title={saveDraftTitle}
      >
        {saveDraftLabel}
      </button>
    ) : null}
    {showNext && onNext ? (
      <button
        type="button"
        className={wizardNextClass}
        onClick={() => void onNext()}
        disabled={transitionBusy || !canNavigateNext}
        title={nextTitle}
      >
        Suivant
      </button>
    ) : null}
    {!hidePerStepSubmit && onSubmitForReview ? (
      <button
        type="button"
        className={wizardSubmitClass}
        onClick={() => void onSubmitForReview()}
        disabled={transitionBusy || submitDisabled}
      >
        {submitLabel}
      </button>
    ) : null}
    <ReportDraftGlobalSubmitButton currentStep={currentStep} currentPayload={currentPayload} />
  </div>
);
