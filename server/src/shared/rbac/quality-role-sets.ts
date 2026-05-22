import { AppRoleCode } from './app-role.code';

/** Global app role that manages the quality criteria catalog (not report-team QC membership). */
export const QUALITY_CRITERIA_MANAGER_ROLE = AppRoleCode.QUALITY_CHECKER;

/** Roles that may read published criteria in the transversal catalog. */
export const QUALITY_CRITERIA_READER_ROLES = [
  AppRoleCode.HUNTER,
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
  AppRoleCode.COORDINATOR,
  AppRoleCode.SUPER_ADMIN,
  AppRoleCode.QUALITY_CONTENT,
] as const;

/** Roles that may toggle criterion checks on a report draft (with draft access). */
export const QUALITY_CRITERIA_CHECK_ROLES = [
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
] as const;
