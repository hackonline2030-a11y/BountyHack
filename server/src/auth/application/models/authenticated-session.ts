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
  /**
   * Opaque refresh secret (only the raw value is sent to the client; DB stores SHA-256).
   * Prefer httpOnly cookie at HTTP boundary rather than exposing in JSON when possible.
   */
  refreshToken?: string;
}
