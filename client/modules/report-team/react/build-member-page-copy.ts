import type { TFunction } from "i18next";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";

export function buildMemberPageCopy(
  t: TFunction<readonly ["reportTeams", "common"]>,
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
    membersLabel: t("reportTeams.myTeams.members"),
    updatedLabel: t("reportTeams.myTeams.updated"),
    requestsTitle: t("reportTeams.requests.title"),
    requestsEmpty: t("reportTeams.requests.empty"),
    statusPending: t("reportTeams.requests.statusPending"),
    statusApproved: t("reportTeams.requests.statusApproved"),
    statusRejected: t("reportTeams.requests.statusRejected"),
    submittedAt: t("reportTeams.requests.submittedAt"),
    enrollTitle: t("reportTeams.enroll.title"),
    enrollDescription: t("reportTeams.enroll.description"),
    enrollSubmit: t("reportTeams.enroll.submit"),
    enrollSubmitting: t("reportTeams.enroll.submitting"),
    enrollSuccess: t("reportTeams.enroll.success"),
    enrollAlreadyPending: t("reportTeams.enroll.alreadyPending"),
    enrollErrorGeneric: t("reportTeams.enroll.errorGeneric"),
    askTitle: t("reportTeams.askJoin.title"),
    askDescription: t("reportTeams.askJoin.description"),
    openReportDraft: t("reportTeams.myTeams.openReportDraft"),
    leaveTeam: t("reportTeams.myTeams.leaveTeam"),
    leaveTeamModalTitle: t("reportTeams.myTeams.leaveTeamModalTitle"),
    leaveTeamConfirm: (teamLabel: string) =>
      t("reportTeams.myTeams.leaveTeamConfirm", { label: teamLabel }),
    leaveTeamSubmit: t("reportTeams.myTeams.leaveTeamSubmit"),
    leaveTeamBusy: t("reportTeams.myTeams.leaveTeamBusy"),
    primaryHunterLeaveAlert: t("reportTeams.myTeams.primaryHunterLeaveAlert"),
    requestLeaveSubmit: t("reportTeams.myTeams.requestLeaveSubmit"),
    requestLeaveBusy: t("reportTeams.myTeams.requestLeaveBusy"),
    requestLeavePending: t("reportTeams.myTeams.requestLeavePending"),
    requestLeaveType: t("reportTeams.myTeams.requestLeaveType"),
    roleLabels,
    confirmModalCancel: t("common:confirmModal.cancel"),
    confirmModalConfirming: t("common:confirmModal.confirming"),
    backHref: options?.backHref,
    backLabel: options?.backLabel,
  };
}
