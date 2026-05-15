import type { TFunction } from "i18next";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";

export function buildAskJoinLabels(t: TFunction<"reportTeams">) {
  const roles: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };
  return {
    teamIdLabel: t("reportTeams.askJoin.teamIdLabel"),
    teamIdPlaceholder: t("reportTeams.askJoin.teamIdPlaceholder"),
    roleLabel: t("reportTeams.askJoin.roleLabel"),
    messageLabel: t("reportTeams.askJoin.messageLabel"),
    messagePlaceholder: t("reportTeams.askJoin.messagePlaceholder"),
    submit: t("reportTeams.askJoin.submit"),
    submitting: t("reportTeams.askJoin.submitting"),
    success: t("reportTeams.askJoin.success"),
    errorTeamId: t("reportTeams.askJoin.errorTeamId"),
    roles,
  };
}
