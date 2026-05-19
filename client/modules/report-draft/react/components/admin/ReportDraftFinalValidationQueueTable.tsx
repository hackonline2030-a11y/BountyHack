"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { ReportDraftFinalValidationSummary } from "@modules/report-draft/core/model/report-draft-final-validation-summary.domain-model";
import { ReportDraftAggregateStatusBadge } from "@modules/report-draft/react/components/ReportDraftAggregateStatusBadge";
import { reportDraftAggregateStatusRowClass } from "@modules/report-draft/core/view/report-draft-aggregate-status-styles";
import {
  stepStatusLabelFr,
  stepStatusPillClassFr,
} from "@modules/report-draft/react/wizard/step-status-fr";

type Props = {
  lng: string;
  items: readonly ReportDraftFinalValidationSummary[];
};

type StatusFilter = ReportDraftDomainModel.AggregateStatus | "all";

const FILTER_OPTIONS: readonly StatusFilter[] = [
  "ready-to-program",
  "all",
  "under-review",
  "draft",
  "submitted-to-program",
  "published",
  "rejected",
  "given-up",
] as const;

const STEP_KEYS = [
  "meta",
  "description",
  "collection",
  "exploitation",
  "proofOfConcept",
  "risks",
  "remediation",
  "final",
] as const;

const STEP_LABELS: Record<(typeof STEP_KEYS)[number], string> = {
  meta: "Meta",
  description: "Desc.",
  collection: "Coll.",
  exploitation: "Expl.",
  proofOfConcept: "PoC",
  risks: "Risq.",
  remediation: "Rem.",
  final: "Fin.",
};

export const ReportDraftFinalValidationQueueTable: React.FC<Props> = ({
  lng,
  items,
}) => {
  const { t } = useT(["reportDraft", "myReports"]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ready-to-program");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((row) => row.aggregateStatus === statusFilter);
  }, [items, statusFilter]);

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
    <div className="dashboard-card flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-dashboard-text">
            {t("reportDraft.finalValidation.filter.label")}
          </span>
          <select
            className="rounded-md border border-dashboard-divider bg-white px-3 py-2 text-sm text-dashboard-text shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            {FILTER_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`reportDraft.finalValidation.filter.options.${value}`)}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-dashboard-text-muted">
          {t("reportDraft.finalValidation.table.count", {
            count: filtered.length,
            total: items.length,
          })}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashboard-divider bg-dashboard-accent-soft/40 px-4 py-6 text-center text-sm text-dashboard-text-muted">
          {t("reportDraft.finalValidation.table.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dashboard-divider">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-dashboard-divider bg-white text-xs font-semibold uppercase tracking-wide text-dashboard-text-muted">
                <th className="px-3 py-2">
                  {t("reportDraft.finalValidation.table.columns.report")}
                </th>
                <th className="px-3 py-2">
                  {t("reportDraft.finalValidation.table.columns.status")}
                </th>
                <th className="px-3 py-2">
                  {t("reportDraft.finalValidation.table.columns.team")}
                </th>
                <th className="px-3 py-2">
                  {t("reportDraft.finalValidation.table.columns.steps")}
                </th>
                <th className="px-3 py-2">
                  {t("reportDraft.finalValidation.table.columns.updated")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const title =
                  row.reportTitle.trim() ||
                  t("reportDraft.finalValidation.table.untitled");
                const detailHref = `/${lng}/administration/final-validation/${row.id}`;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-dashboard-divider/80 transition-colors ${reportDraftAggregateStatusRowClass(row.aggregateStatus)}`}
                  >
                    <td className="px-3 py-3 align-top">
                      <Link
                        href={detailHref}
                        className="font-semibold text-dashboard-text underline-offset-2 hover:underline"
                      >
                        {title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[10px] text-dashboard-text-muted">
                        {row.id}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <ReportDraftAggregateStatusBadge
                        status={row.aggregateStatus}
                        label={t(`myReports:myReports.status.${row.aggregateStatus}`)}
                      />
                    </td>
                    <td className="px-3 py-3 align-top text-dashboard-text-muted">
                      {row.teamLabel ?? "—"}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {STEP_KEYS.map((key) => (
                          <span
                            key={key}
                            title={STEP_LABELS[key]}
                            className={`${stepStatusPillClassFr(row.stepStatuses[key])} px-1.5! py-0.5! text-[9px]!`}
                          >
                            {STEP_LABELS[key]}:{" "}
                            {stepStatusLabelFr(row.stepStatuses[key])}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top text-dashboard-text-muted">
                      {formatDate(row.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};