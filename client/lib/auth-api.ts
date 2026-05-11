/**
 * Browser calls to Nest auth (`PassportJwtAuthController`).
 * Uses credentials so httpOnly cookies work when Nest sends Set-Cookie.
 */

import { nestAuthAbsoluteUrl } from "@/lib/nest-auth-url";

const authUrl = (path: string) => nestAuthAbsoluteUrl(path);

export type NestAuthLoginBody = { email: string; password: string; code?: string };
export type NestAuthRegisterBody = {
  username: string;
  email: string;
  password: string;
  /** Optional; Nest defaults to USER when omitted. */
  roleCode?: string;
};

/** Normalizes Nest `HttpException` / validation payloads for UI copy. */
export function messageFromNestBody(data: unknown, fallback: string): string {
  if (data === null || data === undefined) return fallback;

  const record = typeof data === "object" ? (data as Record<string, unknown>) : null;

  /** Nest sends the specific reason on `message` and the generic HTTP phrase on `error` (e.g. Unauthorized). Prefer `message` so flows like two-step login can detect "TOTP code required". */
  const msg = record?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (
    Array.isArray(msg) &&
    msg.every((m): m is string => typeof m === "string")
  ) {
    const joined = msg.join(", ").trim();
    if (joined) return joined;
  }

  const legacy =
    typeof record?.error === "string" ? (record.error as string) : null;
  if (legacy) return legacy;

  return fallback;
}

export async function postAuthLogin(body: NestAuthLoginBody) {
  return fetch(authUrl("/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
}

/** Proxied on Next so SUPER_ADMIN’s httpOnly JWT is attached server-side (`/api/account/register-user`). */
export async function postAuthRegister(body: NestAuthRegisterBody) {
  return fetch("/api/account/register-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
}

/** Rotates opaque refresh cookie and returns JSON `{ token, user, require2FA? }`. */
export async function postAuthRefresh() {
  return fetch(authUrl("/refresh"), {
    method: "POST",
    credentials: "include",
  });
}

/** Revokes opaque refresh on Nest and clears its httpOnly refresh cookie; call `DELETE /api/session` next to drop the Next access cookie. */
export async function postAuthLogout() {
  return fetch(authUrl("/logout"), {
    method: "POST",
    credentials: "include",
  });
}
