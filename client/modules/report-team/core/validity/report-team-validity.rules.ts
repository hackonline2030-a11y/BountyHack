import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import type { RoleValidityRules } from "@modules/report-team/core/validity/role-validity.engine";

/** Roles that count toward team composition rules (excludes super_admin). */
export type ReportTeamWorkflowRole = Exclude<ReportTeamMemberRole, "super_admin">;

/**
 * Report team validity rules — edit this array to change policy.
 *
 * Structure: AND across rows, OR within each row.
 *
 * Business rule (enforced on the server): at most one quality checker per team.
 *
 * Current — hunter AND (mentor OR quality_checker):
 *   [['hunter'], ['mentor', 'quality_checker']]
 *
 * All three required — hunter AND mentor AND quality_checker:
 *   allRolesRequired(['hunter', 'mentor', 'quality_checker'])
 *   // or: [['hunter'], ['mentor'], ['quality_checker']]
 *
 * Legacy flat AND (hunter + mentor + QC):
 *   allRolesRequired(['hunter', 'quality_checker', 'mentor'])
 */
export const REPORT_TEAM_VALIDITY_RULES: RoleValidityRules<ReportTeamWorkflowRole> = [
  ["hunter"],
  ["mentor", "quality_checker"],
];
