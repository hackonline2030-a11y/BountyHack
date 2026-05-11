/**
 * Stable role codes persisted in Postgres `roles.name` (aligned with seeded `roles.id` 1–7).
 */
export enum AppRoleCode {
  USER = 'USER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  HUNTER = 'HUNTER',
  MENTOR = 'MENTOR',
  QUALITY_CHECKER = 'QUALITY_CHECKER',
  COORDINATOR = 'COORDINATOR',
  QUALITY_CONTENT = 'QUALITY_CONTENT',
}

export const APP_ROLE_CODE_VALUES = Object.values(AppRoleCode) as AppRoleCode[];
