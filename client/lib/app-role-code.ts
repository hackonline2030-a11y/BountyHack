/**
 * Must match Nest `AppRoleCode` and Postgres `roles.name` (seed SQL : `server/prisma/seed/roles.sql`).
 */
export enum AppRoleCode {
  USER = "USER",
  SUPER_ADMIN = "SUPER_ADMIN",
  HUNTER = "HUNTER",
  MENTOR = "MENTOR",
  QUALITY_CHECKER = "QUALITY_CHECKER",
  COORDINATOR = "COORDINATOR",
  QUALITY_CONTENT = "QUALITY_CONTENT",
}

/** Order shown in admin register dropdown. */
export const REGISTER_ROLE_OPTIONS: AppRoleCode[] = [
  AppRoleCode.USER,
  AppRoleCode.SUPER_ADMIN,
  AppRoleCode.HUNTER,
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
  AppRoleCode.COORDINATOR,
  AppRoleCode.QUALITY_CONTENT,
];
