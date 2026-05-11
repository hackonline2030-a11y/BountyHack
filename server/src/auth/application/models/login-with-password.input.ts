/** Credential payload for signing in with email + password (application / port boundary). */
export interface LoginWithPasswordInput {
  email: string;
  password: string;
  /** Optional current TOTP code (required when account 2FA is enabled). */
  code?: string;
}
