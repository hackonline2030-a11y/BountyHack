"use client";

import { type FC } from "react";
import { useT } from "next-i18next/client";
import type { QualityReportDraftTarget } from "@modules/quality/model/quality.types";

export type QualityCriterionReportTargetsModalCriterion = {
  code: string;
  title: string;
};

type Props = {
  criterion: QualityCriterionReportTargetsModalCriterion;
  rows: QualityReportDraftTarget[];
  loading: boolean;
  onClose: () => void;
};

export const QualityCriterionReportTargetsModal: FC<Props> = ({
  criterion,
  rows,
  loading,
  onClose,
}) => {
  const { t } = useT("quality");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-slate-900/50"
        aria-label={t("reportTargets.close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quality-report-targets-title"
        className="relative z-10 flex max-h-[min(85vh,36rem)] w-full max-w-2xl flex-col rounded-xl border border-dashboard-card-border bg-white p-6 shadow-xl"
      >
        <h2
          id="quality-report-targets-title"
          className="text-lg font-semibold text-dashboard-text"
        >
          {t("reportTargets.title")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          <span className="font-mono font-bold text-dashboard-accent">
            {criterion.code}
          </span>{" "}
          — {criterion.title}
        </p>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-dashboard-text-muted">
              {t("reportTargets.loading")}
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-dashboard-text-muted">
              {t("reportTargets.empty")}
            </p>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-dashboard-divider text-xs font-semibold uppercase tracking-wide text-dashboard-text-muted">
                  <th className="py-2 pr-3">{t("reportTargets.colTargetId")}</th>
                  <th className="py-2 pr-3">{t("reportTargets.colTitle")}</th>
                  <th className="py-2">{t("reportTargets.colTeam")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-dashboard-divider last:border-0"
                  >
                    <td className="py-2 pr-3 font-mono text-xs text-dashboard-text">
                      {row.id}
                    </td>
                    <td className="py-2 pr-3 font-medium text-dashboard-text">
                      {row.reportTitle}
                    </td>
                    <td className="py-2 text-dashboard-text-muted">
                      {row.teamLabel ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-md border border-dashboard-divider px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-slate-50"
            onClick={onClose}
          >
            {t("reportTargets.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
