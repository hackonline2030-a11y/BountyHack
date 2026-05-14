import "server-only";

import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

/**
 * Outcome of `fetchRoleFromNest`. Tagged so the caller can distinguish
 * "Nest rejected this token" (auth) from "Nest didn't answer" (infra) —
 * both must be denied, but only one means "your credentials are wrong".
 */
export type FetchRoleResult =
  | { ok: true; roleCode: string; username: string | null }
  | { ok: false; kind: "unauthenticated" | "unreachable" | "malformed_payload" };

function readString(data: unknown, key: string): string | null {
  if (!data || typeof data !== "object") return null;
  const value = (data as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Reads the authoritative `roleCode` for a raw Nest access JWT, by calling
 * `GET …/users/me` server-to-server. Used by `POST /api/session` to enforce
 * the login-time role allow-list **before** the cookie is set (eliminates
 * the create-then-revoke TOCTOU window), and by other server-only callers
 * that already hold a verified token in hand.
 *
 * Security note: this is the *single* server-side function authorized to
 * derive a role from a JWT. Do not parse `roleCode` out of JWT claims —
 * Postgres `roles.name` is the source of truth (Nest emits the JWT but
 * the role lives in the DB and can change without a new token).
 */
export async function fetchRoleFromNest(token: string): Promise<FetchRoleResult> {
  let res: Response;
  try {
    res = await fetch(nestInternalApiUrl("users/me"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return { ok: false, kind: "unreachable" };
  }

  if (res.status === 401) {
    return { ok: false, kind: "unauthenticated" };
  }
  if (!res.ok) {
    return { ok: false, kind: "unreachable" };
  }

  const data: unknown = await res.json().catch(() => null);
  const roleCode = readString(data, "roleCode");
  if (!roleCode) {
    return { ok: false, kind: "malformed_payload" };
  }

  return { ok: true, roleCode, username: readString(data, "username") };
}
