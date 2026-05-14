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

/**
 * Roles that may currently hold an application session on the Next.js BFF.
 *
 * `POST /api/session` rejects login for any role outside this allow-list and
 * **never sets the session cookie** in that case — so we don't create
 * "doomed" sessions just to revoke them client-side. Extend this list when
 * a new role gains its own dashboard.
 */
export const APP_LOGIN_ALLOWED_ROLES: readonly AppRoleCode[] = [
  AppRoleCode.SUPER_ADMIN,
  AppRoleCode.HUNTER,
];
