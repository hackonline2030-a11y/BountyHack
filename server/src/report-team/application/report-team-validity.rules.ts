import type { ReportTeamMemberRoleWire } from '../models/report-team-api.types';
import type { RoleValidityRules } from './role-validity.engine';

/**
 * Report team validity rules — keep in sync with
 * `client/modules/report-team/core/validity/report-team-validity.rules.ts`.
 *
 * Structure: AND across rows, OR within each row.
 *
 * Current — hunter AND (mentor OR quality_checker):
 *   [['hunter'], ['mentor', 'quality_checker']]
 *
 * All three required:
 *   allRolesRequired(['hunter', 'mentor', 'quality_checker'])
 */
export const REPORT_TEAM_VALIDITY_RULES: RoleValidityRules<ReportTeamMemberRoleWire> =
  [
    ['hunter'],
    ['mentor', 'quality_checker'],
  ];
