import type {
  ReportTeamMemberRoleWire,
  ReportTeamValidityWire,
} from '../models/report-team-api.types';

const REQUIRED_ROLES: ReadonlySet<ReportTeamMemberRoleWire> = new Set([
  'hunter',
  'quality_checker',
  'mentor',
]);

export function computeTeamValidity(
  memberRoles: ReadonlyArray<ReportTeamMemberRoleWire>,
): ReportTeamValidityWire {
  const present = new Set(memberRoles);
  for (const role of REQUIRED_ROLES) {
    if (!present.has(role)) {
      return 'incomplete';
    }
  }
  return 'valid';
}
