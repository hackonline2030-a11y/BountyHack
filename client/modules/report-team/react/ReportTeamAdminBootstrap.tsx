"use client";

import { useEffect, type FC } from "react";
import { useT } from "next-i18next/client";
import { deleteReportTeam } from "@modules/report-team/core/useCase/delete-report-team.usecase";
import { loadAdminTeams } from "@modules/report-team/core/useCase/load-admin-teams.usecase";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

export const ReportTeamAdminBootstrap: FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useT("reportTeams");
  const { allTeams, loadStatus, loadError, mutationError } = useAppSelector(
    (s) => s.reportTeams,
  );

  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };

  useEffect(() => {
    void dispatch(loadAdminTeams());
  }, [dispatch]);

  async function onDelete(id: string, label: string) {
    if (!window.confirm(t("reportTeams.admin.deleteConfirm"))) return;
    try {
      await dispatch(deleteReportTeam({ teamId: id }));
    } catch {
      /* mutationError in slice */
    }
  }

  if (loadStatus === "loading" && allTeams.length === 0) {
    return <p className="text-sm text-dashboard-text-muted">{t("reportTeams.askJoin.submitting")}</p>;
  }

  if (loadStatus === "error") {
    return (
      <p role="alert" className="text-sm text-red-600">
        {loadError}
      </p>
    );
  }

  return (
    <div>
      {mutationError ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {mutationError}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-dashboard-card-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-dashboard-divider bg-dashboard-accent-soft/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-dashboard-text">
                {t("reportTeams.admin.table.reportDraftId")}
              </th>
              <th className="px-4 py-3 font-semibold text-dashboard-text">
                {t("reportTeams.admin.table.label")}
              </th>
              <th className="px-4 py-3 font-semibold text-dashboard-text">
                {t("reportTeams.admin.table.validity")}
              </th>
              <th className="px-4 py-3 font-semibold text-dashboard-text">
                {t("reportTeams.admin.table.members")}
              </th>
              <th className="px-4 py-3 font-semibold text-dashboard-text">
                {t("reportTeams.admin.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {allTeams.map((team) => (
              <tr key={team.id} className="border-b border-dashboard-divider last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-dashboard-text-muted">
                  {team.reportDraftId}
                </td>
                <td className="px-4 py-3 text-dashboard-text">{team.label}</td>
                <td className="px-4 py-3">
                  <ReportTeamValidityBadge
                    validity={team.validity}
                    validLabel={t("reportTeams.validity.valid")}
                    incompleteLabel={t("reportTeams.validity.incomplete")}
                  />
                </td>
                <td className="px-4 py-3 text-dashboard-text-muted">
                  {team.members
                    .map((m) => `${m.displayName} (${roleLabels[m.role]})`)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600 hover:underline"
                    onClick={() => void onDelete(team.id, team.label)}
                  >
                    {t("reportTeams.admin.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
