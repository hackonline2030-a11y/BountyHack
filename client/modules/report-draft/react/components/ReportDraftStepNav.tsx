"use client";

import type { FC, ReactNode } from "react";
import { ReportDraftGlobalSubmitButton } from "@modules/report-draft/react/components/ReportDraftGlobalSubmitButton";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  wizardBackClass,
  wizardNextClass,
  wizardSubmitClass,
} from "@modules/app/nextjs/components/buttons/button-styles";

type Props = {
  transitionBusy: boolean;
  /** When set, back is clickable; when omitted, back stays disabled (first step). */
  onBack?: () => void;
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
      onClick={onBack}
      disabled={transitionBusy || !onBack}
      aria-label={onBack ? undefined : "Retour (indisponible — première étape)"}
    >
      Retour
    </button>
    {showNext && onNext ? (
      <button
        type="button"
        className={wizardNextClass}
        onClick={onNext}
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
