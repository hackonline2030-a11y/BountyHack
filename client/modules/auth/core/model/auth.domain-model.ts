/** Shape of Nest `PassportJwtTokenService` access payload after verification. */
export type VerifiedAccessPayload = {
  sub: string;
  email: string;
  /** JWT `exp` (seconds since epoch). */
  expSeconds: number;
};

export type EstablishAppSessionResult =
  | { outcome: "success" }
  | { outcome: "invalid_lng" }
  | { outcome: "token_rejected" }
  | { outcome: "token_expired" };

export type RequireAppSessionResult =
  | { ok: true; payload: VerifiedAccessPayload }
  | { ok: false; kind: "missing_cookie" | "invalid_token" };

/**
 * Raw JWT for server-side `Authorization: Bearer` to Nest (BFF, DAL `fetch`).
 * No TOTP domain logic — only session + cookie orchestration.
 */
export type SessionBearerForUpstreamResult =
  | { ok: true; token: string }
  | {
      ok: false;
      kind: "missing_cookie" | "invalid_token" | "missing_raw";
    };
