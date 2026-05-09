/** Public user fields returned after authentication (JWT login / register). */
export interface AuthenticatedUserProfile {
  uid: string;
  email: string;
  username: string;
}

/** Result of password-based sign-in / registration (application / HTTP response body). */
export interface AuthenticatedSession {
  token: string;
  user: AuthenticatedUserProfile;
  /** When true, caller must supply a second factor before the session is complete. */
  require2FA?: boolean;
}
