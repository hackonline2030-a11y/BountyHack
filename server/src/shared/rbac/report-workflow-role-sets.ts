import { AppRoleCode } from './app-role.code';

/** Roles that participate in report drafts and report teams (excludes plain USER). */
export const REPORT_WORKFLOW_PARTICIPANT_ROLES = [
  AppRoleCode.HUNTER,
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
  AppRoleCode.COORDINATOR,
  AppRoleCode.SUPER_ADMIN,
] as const;

/** Roles that may enroll in or request to join a report team. */
export const REPORT_TEAM_MEMBER_ROLES = [
  AppRoleCode.HUNTER,
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
] as const;

export const COORDINATOR_OR_SUPER_ADMIN_ROLES = [
  AppRoleCode.COORDINATOR,
  AppRoleCode.SUPER_ADMIN,
] as const;
