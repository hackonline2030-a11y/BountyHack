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
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) => (draftId ? s.reportDrafts.byId[draftId] : undefined));
  const globalSubmissionsById = useAppSelector((s) => s.reportDrafts.globalSubmissionsById);
  const globalSubmissions = useMemo(
    () => Object.values(globalSubmissionsById),
    [globalSubmissionsById],
  );
  const transition = useAppSelector((s) => s.reportDrafts.transition);

  const onGlobalSubmit = useCallback(async () => {
    if (!draftId || !draft?.hunterId) return;
    await dispatch(
      submitDraftGloballyForReview({
        draftId,
        currentStep,
        currentPayload,
      }),
    );
  }, [dispatch, draftId, draft?.hunterId, currentStep, currentPayload]);

  if (!isSuperAdminGlobalRevisionMode(draft)) return null;

  const transitionBusy = transition.status === "loading";
  const eligible = countStepsEligibleForGlobalSubmit(draft, globalSubmissions);

  return (
    <button
      type="button"
      className="cursor-pointer rounded-md border border-violet-700 bg-violet-50 px-4 py-2 font-medium text-violet-900 hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => void onGlobalSubmit()}
      disabled={transitionBusy || eligible === 0}
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
