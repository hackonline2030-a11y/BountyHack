import { AppRoleCode } from "@/lib/app-role-code";

export type AdminUserAccountStatus = "valid" | "pending" | "unvalid";

/**
 * Admin-facing user row, exposed to the user-management table.
 *
 * Sensitive columns (password hash, refresh tokens, 2FA material) are absent on purpose:
 * the domain model itself enforces minimal projection, independently of any HTTP layer.
 */
export type AdminUserSummary = {
  uid: string;
  username: string;
  email: string | null;
  roleCode: AppRoleCode | null;
  accountStatus: AdminUserAccountStatus;
};

/**
 * Outcome of {@link listAdminUsersUseCase}. Discriminated union so consumers must
 * handle each error branch explicitly — no `null` / no thrown error to swallow.
 *
 * `unauthorized` is the *upstream* (Nest) rejection of the JWT (401). The DAL
 * wrapper bounces the user to login in that case; the use case itself stays
 * pure and only reports the outcome.
 */
export type ListAdminUsersResult =
  | { ok: true; items: AdminUserSummary[] }
  | { ok: false; reason: "unauthorized" | "unreachable" | "malformed_payload" };
