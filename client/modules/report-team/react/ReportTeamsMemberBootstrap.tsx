"use client";

import { useEffect, type FC } from "react";
import { useT } from "next-i18next/client";
import { leaveReportTeam } from "@modules/report-team/core/useCase/leave-report-team.usecase";
import { requestLeaveReportTeam } from "@modules/report-team/core/useCase/request-leave-report-team.usecase";
import { loadMemberTeams } from "@modules/report-team/core/useCase/load-member-teams.usecase";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import { buildAskJoinLabels } from "@modules/report-team/react/build-ask-join-labels";
import { buildMemberPageCopy } from "@modules/report-team/react/build-member-page-copy";
import { ReportTeamsMemberPage } from "@modules/report-team/react/ReportTeamsMemberPage";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  lng: string;
  currentUserId: string;
  welcomePath: string;
  defaultRole: ReportTeamMemberRole;
  roleOptions: ReadonlyArray<ReportTeamMemberRole>;
};

export const ReportTeamsMemberBootstrap: FC<Props> = ({
  lng,
  currentUserId,
  welcomePath,
  defaultRole,
  roleOptions,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useT("reportTeams");
  const {
    myTeams,
    joinableTeams,
    myJoinRequests,
    myLeaveRequests,
    loadStatus,
    loadError,
    mutationStatus,
    mutationError,
  } = useAppSelector((s) => s.reportTeams);

  useEffect(() => {
    void dispatch(loadMemberTeams());
  }, [dispatch]);

  const prefix = `/${lng}`;
  const copy = buildMemberPageCopy(t, {
    backHref: `${prefix}/${welcomePath}`,
    backLabel: t("reportTeams.backToDashboard"),
  });

  if (
    loadStatus === "loading" &&
    myTeams.length === 0 &&
    myJoinRequests.length === 0 &&
    myLeaveRequests.length === 0
  ) {
    return (
      <p className="text-sm text-dashboard-text-muted">{t("reportTeams.askJoin.submitting")}</p>
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
    <ReportTeamsMemberPage
      copy={copy}
      currentUserId={currentUserId}
      teams={myTeams}
      joinableTeams={joinableTeams}
      joinRequests={myJoinRequests}
      leaveRequests={myLeaveRequests}
      defaultRole={defaultRole}
      roleOptions={roleOptions}
      askJoinLabels={buildAskJoinLabels(t)}
      showMockBanner={false}
      showOpenReportDraftLink={
        defaultRole === "hunter" ||
        defaultRole === "mentor" ||
        defaultRole === "quality_checker"
      }
      onLeaveTeam={(teamId) => void dispatch(leaveReportTeam(teamId))}
      onRequestLeave={(teamId) => void dispatch(requestLeaveReportTeam({ teamId }))}
      leaveTeamBusy={mutationStatus === "loading"}
      leaveTeamError={mutationError}
    />
  );
};
