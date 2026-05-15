import { AuthRoles } from '../../auth/rbac/roles.decorator';
import { AppRoleCode } from './app-role.code';
import {
  COORDINATOR_OR_SUPER_ADMIN_ROLES,
  REPORT_TEAM_MEMBER_ROLES,
  REPORT_WORKFLOW_PARTICIPANT_ROLES,
} from './report-workflow-role-sets';

/** JWT + any report-draft / report-team workflow role. Fine-grained policy still applies per handler. */
export function AuthReportWorkflowParticipant() {
  return AuthRoles(...REPORT_WORKFLOW_PARTICIPANT_ROLES);
}

/** JWT + coordinator or super admin (team management, pending applicants). */
export function AuthCoordinatorOrSuperAdmin() {
  return AuthRoles(...COORDINATOR_OR_SUPER_ADMIN_ROLES);
}

/** JWT + hunter, mentor, QC, or super admin (enroll / join existing team). */
export function AuthReportTeamMember() {
  return AuthRoles(...REPORT_TEAM_MEMBER_ROLES, AppRoleCode.SUPER_ADMIN);
}
