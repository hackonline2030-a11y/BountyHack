import type { AppRoleCode } from '../../shared/rbac/app-role.code';

/**
 * Admin-facing read model for the user-management table.
 *
 * Mirrors a single row of the listing surface (name + email + RBAC role). The fields here
 * are exposed only to administrative consumers — never to the user themselves and never
 * to non-`SUPER_ADMIN` callers. Sensitive columns (`passwordHash`, refresh tokens, 2FA
 * material) are intentionally absent from this shape.
 *
 * Maps to `UserAdminSummaryDto` at the HTTP boundary; the controller never exposes
 * `UserRecord` (current-user profile) for this surface to keep listing and self-profile
 * concerns separate.
 */
export type UserAdminSummary = {
  /** Stable PK (Postgres `users.id`). */
  uid: string;
  /** Display name (Postgres `users.username`); never null. */
  username: string;
  /** Email may be missing for legacy rows; surfaced as `null` in that case. */
  email: string | null;
  /** Resolved from `roles.name` via the `users.role_id` FK; `null` when no role is attached. */
  roleCode: AppRoleCode | null;
};
