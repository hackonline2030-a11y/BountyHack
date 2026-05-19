"use client";

import Link from "next/link";
import { useT } from "next-i18next/client";
import type { OrphanReportDraft } from "@modules/report-team/model/orphan-report-draft.types";
import { ReportDraftAggregateStatusBadge } from "@modules/report-draft/react/components/ReportDraftAggregateStatusBadge";
import { reportDraftAggregateStatusRowClass } from "@modules/report-draft/core/view/report-draft-aggregate-status-styles";

type Props = {
  lng: string;
  items: readonly OrphanReportDraft[];
  /** Super-admin: link draft id to final validation workspace. */
  showFinalValidationLink?: boolean;
  selectedDraftId?: string | null;
  onAttachDraft?: (draft: OrphanReportDraft) => void;
};

export const OrphanReportDraftsTable: React.FC<Props> = ({
  lng,
  items,
  showFinalValidationLink = false,
  selectedDraftId = null,
  onAttachDraft,
}) => {
  const { t } = useT(["reportTeams", "myReports"]);

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(lng, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <section
      className="flex flex-col gap-4 border-t border-dashboard-divider pt-6"
      aria-labelledby="orphan-drafts-heading"
    >
      <header>
        <h2
          id="orphan-drafts-heading"
          className="text-base font-semibold text-dashboard-text"
        >
          {t("reportTeams.orphanDrafts.title")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("reportTeams.orphanDrafts.subheading")}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-dashboard-text-muted">
          {t("reportTeams.orphanDrafts.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dashboard-card-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-dashboard-divider bg-dashboard-accent-soft/40">
              <tr>
                <th className="px-4 py-3 font-semibold text-dashboard-text">
                  {t("reportTeams.orphanDrafts.table.reportDraftId")}
                </th>
                <th className="px-4 py-3 font-semibold text-dashboard-text">
                  {t("reportTeams.orphanDrafts.table.report")}
                </th>
                <th className="px-4 py-3 font-semibold text-dashboard-text">
                  {t("reportTeams.orphanDrafts.table.hunter")}
                </th>
                <th className="px-4 py-3 font-semibold text-dashboard-text">
                  {t("reportTeams.orphanDrafts.table.status")}
                </th>
                <th className="px-4 py-3 font-semibold text-dashboard-text">
                  {t("reportTeams.orphanDrafts.table.updated")}
                </th>
                {onAttachDraft ? (
                  <th className="px-4 py-3 font-semibold text-dashboard-text">
                    {t("reportTeams.orphanDrafts.table.actions")}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const title =
                  row.reportTitle.trim() || t("reportTeams.orphanDrafts.table.untitled");
                const validationHref = `/${lng}/administration/final-validation/${row.id}`;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-dashboard-divider last:border-0 ${reportDraftAggregateStatusRowClass(row.aggregateStatus)}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {showFinalValidationLink ? (
                        <Link
                          href={validationHref}
                          className="text-dashboard-accent underline-offset-2 hover:underline"
                          title={row.id}
                        >
                          {row.id}
                        </Link>
                      ) : (
                        <span title={row.id}>{row.id}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dashboard-text">{title}</td>
                    <td className="px-4 py-3 text-dashboard-text">
                      <span className="font-medium">{row.hunterDisplayName}</span>
                      <span className="mt-0.5 block font-mono text-xs text-dashboard-text-muted">
                        {row.hunterId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ReportDraftAggregateStatusBadge
                        status={row.aggregateStatus}
                        label={t(`myReports:myReports.status.${row.aggregateStatus}`)}
                      />
                    </td>
                    <td className="px-4 py-3 text-dashboard-text-muted">
                      {formatDate(row.updatedAt)}
                    </td>
                    {onAttachDraft ? (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent focus-visible:ring-offset-1 ${
                            selectedDraftId === row.id
                              ? "border-dashboard-accent bg-dashboard-accent text-white"
                              : "border-dashboard-card-border bg-white text-dashboard-text hover:bg-dashboard-accent-soft"
                          }`}
                          onClick={() => onAttachDraft(row)}
                        >
                          {t("reportTeams.orphanDrafts.table.attachRequests")}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
