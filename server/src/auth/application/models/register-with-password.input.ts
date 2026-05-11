import type { AppRoleCode } from '../../../shared/rbac/app-role.code';

/** Credential payload for registering a user (application / port boundary). */
export interface RegisterWithPasswordInput {
  email: string;
  username: string;
  password: string;
  /** Defaults to USER when omitted. Postgres path resolves `roles` row by code. */
  roleCode?: AppRoleCode;
}
