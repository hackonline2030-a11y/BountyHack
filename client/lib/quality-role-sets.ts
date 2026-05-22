import { AppRoleCode } from "@/lib/app-role-code";

export const QUALITY_CRITERIA_READER_ROLES = [
  AppRoleCode.HUNTER,
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
  AppRoleCode.COORDINATOR,
  AppRoleCode.SUPER_ADMIN,
  AppRoleCode.QUALITY_CONTENT,
] as const;

export const QUALITY_CRITERIA_CHECK_ROLES = [
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
] as const;
