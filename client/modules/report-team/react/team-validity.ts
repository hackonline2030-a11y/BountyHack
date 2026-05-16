import type { ReportTeamMemberRole, ReportTeamValidity } from "@modules/report-team/model/report-team.types";

const REQUIRED: ReportTeamMemberRole[] = ["hunter", "quality_checker", "mentor"];

export function computeTeamValidityFromRoles(
  roles: ReadonlyArray<ReportTeamMemberRole>,
): ReportTeamValidity {
  const present = new Set(roles);
  for (const role of REQUIRED) {
    if (!present.has(role)) return "incomplete";
  }
  return "valid";
}
