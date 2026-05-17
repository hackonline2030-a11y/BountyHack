"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type FC } from "react";
import { useT } from "next-i18next/client";
import { deleteReportTeam } from "@modules/report-team/core/useCase/delete-report-team.usecase";
import { loadAdminTeams } from "@modules/report-team/core/useCase/load-admin-teams.usecase";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import { ReportDraftAggregateStatusBadge } from "@modules/report-draft/react/components/ReportDraftAggregateStatusBadge";
import { CoordinatorAttachOrphanTeamPanel } from "@modules/report-team/react/CoordinatorAttachOrphanTeamPanel";
import { OrphanReportDraftsTable } from "@modules/report-team/react/OrphanReportDraftsTable";
import { ReportDraftOpenIcon, TrashIcon } from "@modules/report-team/react/icons";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

const iconActionClass =
  "inline-flex size-8 items-center justify-center rounded-md border border-dashboard-divider bg-white text-dashboard-text transition hover:bg-dashboard-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent focus-visible:ring-offset-1";

const iconActionDangerClass =
  "inline-flex size-8 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1";

export const ReportTeamAdminBootstrap: FC = () => {
  const dispatch = useAppDispatch();
  const params = useParams<{ lng?: string }>();
  const lng = typeof params?.lng === "string" && params.lng.trim() !== "" ? params.lng : "fr";
  const { t } = useT(["reportTeams", "myReports"]);
  const { allTeams, orphanDrafts, pendingJoinRequests, loadStatus, loadError, mutationError } =
    useAppSelector((s) => s.reportTeams);
  const [attachDraftId, setAttachDraftId] = useState<string | null>(null);
  const attachDraft = useMemo(
    () => orphanDrafts.find((d) => d.id === attachDraftId) ?? null,
    [orphanDrafts, attachDraftId],
  );
  const isReady = loadStatus === "success";

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
                {t("reportTeams.admin.table.reportStatus")}
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
            {allTeams.map((team) => {
              const validationHref = `/${lng}/administration/final-validation/${team.reportDraftId}`;
              return (
              <tr key={team.id} className="border-b border-dashboard-divider last:border-0">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link
                    href={validationHref}
                    className="text-dashboard-accent underline-offset-2 hover:underline"
                    title={team.reportDraftId}
                  >
                    {team.reportDraftId}
                  </Link>
                </td>
                <td className="px-4 py-3 text-dashboard-text">{team.label}</td>
                <td className="px-4 py-3">
                  <ReportDraftAggregateStatusBadge
                    status={team.draftAggregateStatus}
                    label={t(
                      `myReports:myReports.status.${team.draftAggregateStatus}`,
                    )}
                  />
                </td>
                <td className="px-4 py-3 text-dashboard-text-muted">
                  {team.members
                    .map((m) => `${m.displayName} (${roleLabels[m.role]})`)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={validationHref}
                      className={iconActionClass}
                      aria-label={t("reportTeams.admin.table.openFinalValidation")}
                      title={t("reportTeams.admin.table.openFinalValidation")}
                    >
                      <ReportDraftOpenIcon className="size-4" />
                    </Link>
                    <button
                      type="button"
                      className={iconActionDangerClass}
                      aria-label={t("reportTeams.admin.delete")}
                      title={t("reportTeams.admin.delete")}
                      onClick={() => void onDelete(team.id, team.label)}
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      <OrphanReportDraftsTable
        lng={lng}
        items={orphanDrafts}
        showFinalValidationLink
        selectedDraftId={attachDraftId}
        onAttachDraft={(draft) => setAttachDraftId(draft.id)}
      />
      {attachDraft ? (
        <CoordinatorAttachOrphanTeamPanel
          orphan={attachDraft}
          pendingJoinRequests={pendingJoinRequests}
          isReady={isReady}
          onCancel={() => setAttachDraftId(null)}
        />
      ) : null}
    </div>
  );
};
