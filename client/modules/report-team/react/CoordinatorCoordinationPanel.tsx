"use client";

import { useEffect, type FC } from "react";
import { useT } from "next-i18next/client";
import { loadCoordinatorTeams } from "@modules/report-team/core/useCase/load-coordinator-teams.usecase";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import { CoordinatorCreateTeamPanel } from "@modules/report-team/react/CoordinatorCreateTeamPanel";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";
import { useAppDispatch, useAppSelector } from "@store/redux/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePrefixFromPathname } from "@/lib/locale-path";

export const CoordinatorCoordinationPanel: FC = () => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const { t } = useT("reportTeams");
  const { allTeams, pendingJoinRequests, loadStatus, loadError, mutationError } =
    useAppSelector((s) => s.reportTeams);

  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };

  const isLoading = loadStatus === "loading" || loadStatus === "idle";
  const isReady = loadStatus === "success";

  useEffect(() => {
    void dispatch(loadCoordinatorTeams());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-12"
        role="status"
        aria-live="polite"
      >
        <span
          className="inline-block size-8 animate-spin rounded-full border-2 border-dashboard-accent border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.loading")}
        </p>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <p role="alert" className="text-sm text-red-600">
        {loadError}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {mutationError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {mutationError}
        </p>
      ) : null}
      <CoordinatorCreateTeamPanel
        pendingJoinRequests={pendingJoinRequests}
        isReady={isReady}
      />
      <section className="dashboard-card p-4 sm:p-5" aria-labelledby="coord-teams">
        <h2 id="coord-teams" className="text-base font-semibold text-dashboard-text">
          {t("reportTeams.coordinator.teamsTitle")}
        </h2>
        {allTeams.length === 0 ? (
          <p className="mt-3 text-sm text-dashboard-text-muted">
            {t("reportTeams.coordinator.teamsEmpty")}
          </p>
        ) : (
          <ul role="list" className="mt-4 flex flex-col gap-3">
            {allTeams.map((team) => (
              <li
                key={team.id}
                className="rounded-lg border border-dashboard-card-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-dashboard-text">{team.label}</p>
                    <p className="mt-1 font-mono text-xs text-dashboard-text-muted">
                      {t("reportTeams.coordinator.reportDraftId")}: {team.reportDraftId}
                    </p>
                  </div>
                  <ReportTeamValidityBadge
                    validity={team.validity}
                    validLabel={t("reportTeams.validity.valid")}
                    incompleteLabel={t("reportTeams.validity.incomplete")}
                  />
                </div>
                <p className="mt-2 text-xs text-dashboard-text-muted">
                  {t("reportTeams.myTeams.members")}
                </p>
                <p className="mt-1 text-sm text-dashboard-text">
                  {team.members.length === 0
                    ? "—"
                    : team.members
                        .map((m) => `${m.displayName} (${roleLabels[m.role]})`)
                        .join(" · ")}
                </p>
                <Link
                  href={`${prefix}/report-draft/${team.reportDraftId}`}
                  className="dashboard-card-cta mt-3 inline-block text-sm"
                >
                  {t("reportTeams.coordinator.openReportDraft")} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
