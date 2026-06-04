import type { AppRoleCode } from '../../../shared/rbac/app-role.code';

/** Credential payload for registering a user (application / port boundary). */
export interface RegisterWithPasswordInput {
  email: string;
  username: string;
  /** When set, creates account with password (legacy / in-memory tests). */
  password?: string;
  /** Defaults to USER when omitted. Postgres path resolves `roles` row by code. */
  roleCode?: AppRoleCode;
  /** Locale for invitation email link path (`en` | `fr`). */
  locale?: string;
  /**
   * When true, no invitation email is sent; the account-setup link is returned to the
   * super-admin caller (fake / test accounts).
   */
  fakeUser?: boolean;
}
