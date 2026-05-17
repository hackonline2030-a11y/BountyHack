"use client";

import { type FC } from "react";
import { useT } from "next-i18next/client";
import { isSuperAdminGlobalRevisionMode } from "@modules/report-draft/core/model/super-admin-final-validation";
import { useAppSelector } from "@store/redux/store";

export const SuperAdminGlobalRevisionBanner: FC = () => {
  const { t } = useT("myReports");
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) => (draftId ? s.reportDrafts.byId[draftId] : undefined));

  if (!isSuperAdminGlobalRevisionMode(draft)) return null;

  return (
    <p
      role="status"
      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950"
    >
      {t("myReports.superAdminFeedback.revisionBannerShort")}
    </p>
  );
};
