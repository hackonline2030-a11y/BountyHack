import { evaluateRoleValidityRules } from "@modules/report-team/core/validity/role-validity.engine";
import { REPORT_TEAM_VALIDITY_RULES } from "@modules/report-team/core/validity/report-team-validity.rules";
import type {
  ReportTeamMemberRole,
  ReportTeamValidity,
} from "@modules/report-team/model/report-team.types";

export function computeTeamValidityFromRoles(
  roles: ReadonlyArray<ReportTeamMemberRole>,
): ReportTeamValidity {
  return evaluateRoleValidityRules(roles, REPORT_TEAM_VALIDITY_RULES)
    ? "valid"
    : "incomplete";
}
