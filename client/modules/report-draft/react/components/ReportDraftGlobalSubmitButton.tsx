"use client";

import { type FC, useCallback, useMemo } from "react";
import { useT } from "next-i18next/client";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  countStepsEligibleForGlobalSubmit,
  isSuperAdminGlobalRevisionMode,
} from "@modules/report-draft/core/model/super-admin-final-validation";
import { submitDraftGloballyForReview } from "@modules/report-draft/core/useCase/submit-draft-globally-for-review.usecase";
import { useAppDispatch, useAppSelector } from "@store/redux/store";
import { useReportDraftSession } from "@modules/report-draft/react/context/report-draft-session.context";
import { globalRevisionSubmitClass } from "@modules/app/nextjs/components/buttons/button-styles";

type Props = {
  currentStep?: ReportDraftDomainModel.ReportDraftStep;
  currentPayload?: unknown;
};

/** Batch-submit all editable steps to QC during super-admin global revision. */
export const ReportDraftGlobalSubmitButton: FC<Props> = ({
  currentStep,
  currentPayload,
}) => {
  const { t } = useT("myReports");
  const dispatch = useAppDispatch();
  const { isDesignatedStepWriter } = useReportDraftSession();
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) => (draftId ? s.reportDrafts.byId[draftId] : undefined));
  const globalSubmissionsById = useAppSelector((s) => s.reportDrafts.globalSubmissionsById);
  const globalSubmissions = useMemo(
    () => Object.values(globalSubmissionsById),
    [globalSubmissionsById],
  );
  const transition = useAppSelector((s) => s.reportDrafts.transition);

  const onGlobalSubmit = useCallback(async () => {
    if (!draftId || !draft?.hunterId || !isDesignatedStepWriter) return;
    await dispatch(
      submitDraftGloballyForReview({
        draftId,
        currentStep,
        currentPayload,
      }),
    );
  }, [dispatch, draftId, draft?.hunterId, currentStep, currentPayload, isDesignatedStepWriter]);

  if (!isSuperAdminGlobalRevisionMode(draft)) return null;

  const transitionBusy = transition.status === "loading";
  const eligible = countStepsEligibleForGlobalSubmit(draft, globalSubmissions);

  return (
    <button
      type="button"
      className={globalRevisionSubmitClass}
      onClick={() => void onGlobalSubmit()}
      disabled={transitionBusy || eligible === 0 || !isDesignatedStepWriter}
      title={
        eligible === 0
          ? t("myReports.wizard.globalSubmit.disabledNone")
          : t("myReports.wizard.globalSubmit.hint")
      }
    >
      {t("myReports.wizard.globalSubmit.button")}
    </button>
  );
};
