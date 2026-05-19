"use client";

import { type FC } from "react";
import { useT } from "next-i18next/client";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { isSuperAdminGlobalRevisionMode } from "@modules/report-draft/core/model/super-admin-final-validation";

type Props = {
  draft: ReportDraftDomainModel.ReportDraft | undefined;
  isLastStep: boolean;
  stepApproved: boolean;
};

/**
 * Shown on the FINAL wizard step when QC has approved that step.
 */
export const ReportDraftFinalStepStatusBanner: FC<Props> = ({
  draft,
  isLastStep,
  stepApproved,
}) => {
  const { t } = useT("myReports");

  if (!isLastStep || !stepApproved || !draft) return null;

  if (
    draft.aggregateStatus === "published" ||
    draft.aggregateStatus === "submitted-to-program"
  ) {
    return (
      <p className="rounded-md border border-emerald-300 bg-emerald-50 p-2 text-sm font-medium text-emerald-950">
        {t("myReports.wizard.finalStep.leadValidated")}
      </p>
    );
  }

  if (isSuperAdminGlobalRevisionMode(draft)) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950">
        {t("myReports.wizard.finalStep.globalRevisionInProgress")}
      </p>
    );
  }

  if (draft.aggregateStatus === "ready-to-program") {
    return (
      <p className="rounded-md border border-sky-200 bg-sky-50 p-2 text-sm text-sky-950">
        {t("myReports.wizard.finalStep.awaitingLeadValidation")}
      </p>
    );
  }

  return null;
};
