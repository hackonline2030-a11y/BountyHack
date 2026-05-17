"use client";

import Link from "next/link";
import { type FC, useMemo } from "react";
import { useT } from "next-i18next/client";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { hasOpenSuperAdminRevisionCycle } from "@modules/report-draft/core/model/super-admin-final-validation";
import { ScrollableTablePanel } from "@modules/report-draft/react/components/ScrollableTablePanel";
import { SubmissionReviewDraftTitleCell } from "@modules/report-draft/react/components/SubmissionReviewDraftTitleCell";

type Props = {
  draftsById: Record<string, ReportDraftDomainModel.ReportDraft | undefined>;
  lng: string;
  /** e.g. `/fr/global-revisions` or `/fr/mentor-global-revisions` */
  reviewBasePath: string;
};

export const GlobalRevisionRequestsTable: FC<Props> = ({
  draftsById,
  lng,
  reviewBasePath,
}) => {
  const { t } = useT("myReports");

  const rows = useMemo(
    () =>
      Object.values(draftsById)
        .filter((d): d is ReportDraftDomainModel.ReportDraft => d != null)
        .filter((d) => hasOpenSuperAdminRevisionCycle(d))
        .sort((a, b) => {
          const ta = a.superAdminRevisionRequestedAt ?? "";
          const tb = b.superAdminRevisionRequestedAt ?? "";
          return tb.localeCompare(ta);
        }),
    [draftsById],
  );

  if (rows.length === 0) return null;

  const dateFmt = new Intl.DateTimeFormat(lng, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section>
      <h2 className="text-lg font-semibold text-dashboard-text">
        {t("myReports.qcSubmissions.globalRevisionTableTitle")}
      </h2>
      <p className="mt-1 text-sm text-dashboard-text-muted">
        {t("myReports.qcSubmissions.globalRevisionTableHint")}
      </p>
      <ScrollableTablePanel className="mt-4 border-amber-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-amber-100 bg-amber-50 text-form-text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">
                {t("myReports.globalRevisionReview.table.report")}
              </th>
              <th className="px-3 py-3 font-medium">
                {t("myReports.globalRevisionReview.table.requestedAt")}
              </th>
              <th className="px-3 py-3 font-medium">
                {t("myReports.globalRevisionReview.table.status")}
              </th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((draft) => {
              const requestedAt = draft.superAdminRevisionRequestedAt?.trim();
              return (
                <tr key={draft.id} className="border-b border-amber-50 last:border-0">
                  <td className="px-3 py-3 align-top">
                    <SubmissionReviewDraftTitleCell draft={draft} />
                  </td>
                  <td className="px-3 py-3 text-form-text-muted">
                    {requestedAt
                      ? dateFmt.format(new Date(requestedAt))
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-form-text-muted">
                    {t(`myReports.status.${draft.aggregateStatus}`)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`${reviewBasePath}/${encodeURIComponent(draft.id)}`}
                      className="rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-900"
                    >
                      {t("myReports.globalRevisionReview.table.consult")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollableTablePanel>
    </section>
  );
};
