import type {
  ReportTeamMemberRoleWire,
  ReportTeamValidityWire,
} from '../models/report-team-api.types';
import { evaluateRoleValidityRules } from './role-validity.engine';
import { REPORT_TEAM_VALIDITY_RULES } from './report-team-validity.rules';

export function computeTeamValidity(
  memberRoles: ReadonlyArray<ReportTeamMemberRoleWire>,
): ReportTeamValidityWire {
  return evaluateRoleValidityRules(memberRoles, REPORT_TEAM_VALIDITY_RULES)
    ? 'valid'
    : 'incomplete';
}
