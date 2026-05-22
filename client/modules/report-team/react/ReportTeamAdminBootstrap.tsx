"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type FC } from "react";
import { useT } from "next-i18next/client";
import { deleteReportDraft } from "@modules/report-draft/core/useCase/delete-report-draft.usecase";
import { deleteReportTeam } from "@modules/report-team/core/useCase/delete-report-team.usecase";
import { loadAdminTeams } from "@modules/report-team/core/useCase/load-admin-teams.usecase";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import { ReportDraftAggregateStatusBadge } from "@modules/report-draft/react/components/ReportDraftAggregateStatusBadge";
import { CoordinatorAttachOrphanTeamPanel } from "@modules/report-team/react/CoordinatorAttachOrphanTeamPanel";
import { ConfirmDangerModal } from "@modules/app/nextjs/components/ConfirmDangerModal";
import { OrphanReportDraftsTable } from "@modules/report-team/react/OrphanReportDraftsTable";
import { iconActionClass } from "@modules/report-team/react/icon-action-buttons";
import { IconActionButton } from "@modules/app/nextjs/components/buttons/IconActionButton";
import { ReportDraftOpenIcon, TrashIcon } from "@modules/report-team/react/icons";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type DraftDeleteTarget = {
  draftId: string;
  label: string;
};

type TeamDeleteTarget = {
  teamId: string;
  label: string;
};

export const ReportTeamAdminBootstrap: FC = () => {
  const dispatch = useAppDispatch();
  const params = useParams<{ lng?: string }>();
  const lng = typeof params?.lng === "string" && params.lng.trim() !== "" ? params.lng : "fr";
  const { t } = useT(["reportTeams", "myReports", "common"]);
  const { allTeams, orphanDrafts, pendingJoinRequests, loadStatus, loadError, mutationError, mutationStatus } =
    useAppSelector((s) => s.reportTeams);
  const [attachDraftId, setAttachDraftId] = useState<string | null>(null);
  const [draftDeleteTarget, setDraftDeleteTarget] = useState<DraftDeleteTarget | null>(null);
  const [teamDeleteTarget, setTeamDeleteTarget] = useState<TeamDeleteTarget | null>(null);
  const attachDraft = useMemo(
    () => orphanDrafts.find((d) => d.id === attachDraftId) ?? null,
    [orphanDrafts, attachDraftId],
  );
  const isReady = loadStatus === "success";
  const isDeletingDraft = mutationStatus === "loading" && draftDeleteTarget !== null;
  const isDeletingTeam = mutationStatus === "loading" && teamDeleteTarget !== null;

  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };

  useEffect(() => {
    void dispatch(loadAdminTeams());
  }, [dispatch]);

  async function onConfirmDeleteTeam() {
    if (!teamDeleteTarget) return;
    try {
      await dispatch(deleteReportTeam({ teamId: teamDeleteTarget.teamId }));
      setTeamDeleteTarget(null);
    } catch {
      /* mutationError in slice */
    }
  }

  async function onConfirmDeleteDraft() {
    if (!draftDeleteTarget) return;
    try {
      await dispatch(deleteReportDraft({ draftId: draftDeleteTarget.draftId }));
      setDraftDeleteTarget(null);
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
                    <IconActionButton
                      variant="danger"
                      aria-label={t("reportTeams.admin.deleteTeam")}
                      title={t("reportTeams.admin.deleteTeam")}
                      onClick={() =>
                        setTeamDeleteTarget({ teamId: team.id, label: team.label })
                      }
                    >
                      <TrashIcon className="size-4" />
                    </IconActionButton>
                    <IconActionButton
                      variant="draftDanger"
                      aria-label={t("reportTeams.admin.deleteDraft")}
                      title={t("reportTeams.admin.deleteDraft")}
                      onClick={() =>
                        setDraftDeleteTarget({
                          draftId: team.reportDraftId,
                          label: team.label,
                        })
                      }
                    >
                      <TrashIcon className="size-4" />
                    </IconActionButton>
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
      <ConfirmDangerModal
        open={draftDeleteTarget !== null}
        title={t("reportTeams.admin.deleteDraftModalTitle")}
        cancelLabel={t("common:confirmModal.cancel")}
        confirmLabel={t("reportTeams.admin.deleteDraftModalConfirm")}
        confirming={isDeletingDraft}
        confirmingLabel={t("common:confirmModal.confirming")}
        onCancel={() => {
          if (!isDeletingDraft) setDraftDeleteTarget(null);
        }}
        onConfirm={() => void onConfirmDeleteDraft()}
      >
        {draftDeleteTarget
          ? t("reportTeams.admin.deleteDraftModalBody", {
              label: draftDeleteTarget.label,
              draftId: draftDeleteTarget.draftId,
            })
          : null}
      </ConfirmDangerModal>
      <ConfirmDangerModal
        open={teamDeleteTarget !== null}
        title={t("reportTeams.admin.deleteTeamModalTitle")}
        cancelLabel={t("common:confirmModal.cancel")}
        confirmLabel={t("reportTeams.admin.deleteTeamModalConfirm")}
        confirming={isDeletingTeam}
        confirmingLabel={t("common:confirmModal.confirming")}
        onCancel={() => {
          if (!isDeletingTeam) setTeamDeleteTarget(null);
        }}
        onConfirm={() => void onConfirmDeleteTeam()}
      >
        {teamDeleteTarget
          ? t("reportTeams.admin.deleteTeamConfirm", { label: teamDeleteTarget.label })
          : null}
      </ConfirmDangerModal>
    </div>
  );
};
