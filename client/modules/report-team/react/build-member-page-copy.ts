import type { TFunction } from "i18next";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";

export function buildMemberPageCopy(
  t: TFunction<"reportTeams">,
  options?: { backHref?: string; backLabel?: string },
) {
  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };
  return {
    metaTitle: t("reportTeams.metaTitle"),
    heading: t("reportTeams.heading"),
    subheading: t("reportTeams.subheading"),
    mockBanner: t("reportTeams.mockBanner"),
    validityValid: t("reportTeams.validity.valid"),
    validityIncomplete: t("reportTeams.validity.incomplete"),
    validityHint: t("reportTeams.validity.hint"),
    myTeamsTitle: t("reportTeams.myTeams.title"),
    myTeamsEmpty: t("reportTeams.myTeams.empty"),
    teamIdLabel: t("reportTeams.myTeams.teamId"),
    membersLabel: t("reportTeams.myTeams.members"),
    updatedLabel: t("reportTeams.myTeams.updated"),
    requestsTitle: t("reportTeams.requests.title"),
    requestsEmpty: t("reportTeams.requests.empty"),
    statusPending: t("reportTeams.requests.statusPending"),
    statusApproved: t("reportTeams.requests.statusApproved"),
    statusRejected: t("reportTeams.requests.statusRejected"),
    submittedAt: t("reportTeams.requests.submittedAt"),
    askTitle: t("reportTeams.askJoin.title"),
    askDescription: t("reportTeams.askJoin.description"),
    roleLabels,
    backHref: options?.backHref,
    backLabel: options?.backLabel,
  };
}
