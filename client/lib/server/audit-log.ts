import "server-only";

/**
 * Minimal structured audit log for security-relevant events.
 *
 * Output: a single line of JSON per event, written to **stderr** via
 * `console.warn`. This is intentionally plain so it works in dev without
 * setup, and so any production log aggregator (Datadog, ELK, journald,
 * Vercel, …) parses it natively as a structured record.
 *
 * Scope (today):
 *   - RBAC denials in `verifySessionForRoles` (role mismatch, Nest failures
 *     during role resolution, stale-token rejections from `users/me`).
 *   - Login allow-list refusals in `POST /api/session`.
 *
 * What we deliberately don't log:
 *   - Tokens, passwords, or any other credential material.
 *   - Full request bodies.
 *
 * Why warn-level: a denial is "interesting, not an error" — operators want
 * to see them in dashboards and alert on bursts, but a single occurrence
 * should not page anyone. Errors during logging itself are swallowed so a
 * faulty audit pipeline can never bring down a page render.
 */

export type AuditOutcome = "deny";

export type AuditEvent = {
  /** Dot-namespaced event identifier, e.g. `rbac.denied`, `session.role_not_allowed`. */
  event: string;
  /** Today only denials are emitted; broaden when we start logging successes. */
  outcome: AuditOutcome;
  /** Programmatic reason (machine-parseable), e.g. `role_mismatch`. */
  reason?: string;
  /** Subject identifier from the verified JWT (`sub`). Never the JWT itself. */
  userId?: string;
  /** Subject email from the verified JWT. */
  email?: string;
  /** Role observed in Nest `users/me` at the moment of the decision. */
  roleCode?: string | null;
  /** Roles that would have been accepted at the call site. */
  allowedRoles?: readonly string[];
  /** Free-form identifier of the protected resource (route handler path, etc.). */
  resource?: string;
  /** First IP from `x-forwarded-for` when present. May be spoofable; useful in aggregate. */
  ip?: string | null;
  /** Client `user-agent` when present. */
  userAgent?: string | null;
};

export function logAuditEvent(event: AuditEvent): void {
  try {
    console.warn(
      JSON.stringify({
        severity: "warn",
        timestamp: new Date().toISOString(),
        ...event,
      }),
    );
  } catch {
    // Audit must never break the request path.
  }
}

/**
 * Pulls the most useful network metadata out of the standard Next.js
 * `Headers` object. Both fields are best-effort: `x-forwarded-for` is
 * spoofable end-to-end, and `user-agent` is trivially forgeable. They are
 * still valuable for **aggregate** signal ("100 denies from this UA in 30s").
 */
export function extractRequestMetadata(headers: Headers): {
  ip: string | null;
  userAgent: string | null;
} {
  const xff = headers.get("x-forwarded-for");
  const ip = xff ? (xff.split(",")[0]?.trim() || null) : null;
  return {
    ip,
    userAgent: headers.get("user-agent"),
  };
}
