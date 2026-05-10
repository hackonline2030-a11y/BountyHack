/**
 * Browser calls to Nest auth (`PassportJwtAuthController`).
 * Uses credentials so httpOnly cookies work when Nest sends Set-Cookie.
 */

const AUTH_API_BASE =
  (process.env.NEXT_PUBLIC_AUTH_API ?? "").replace(/\/+$/, "") || undefined;

const API_PREFIX =
  (process.env.NEXT_PUBLIC_AUTH_API_PREFIX ?? "api").replace(/^\/+|\/+$/g, "");

function authApiBase(): string {
  if (!AUTH_API_BASE) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_API is not set (e.g. http://localhost:3000)"
    );
  }
  return AUTH_API_BASE;
}

const authUrl = (path: string) =>
  `${authApiBase()}/${API_PREFIX}/auth${path}`;

export type NestAuthLoginBody = { email: string; password: string };
export type NestAuthRegisterBody = {
  username: string;
  email: string;
  password: string;
};

/** Normalizes Nest `HttpException` / validation payloads for UI copy. */
export function messageFromNestBody(data: unknown, fallback: string): string {
  if (data === null || data === undefined) return fallback;

  const record = typeof data === "object" ? (data as Record<string, unknown>) : null;

  const legacy =
    typeof record?.error === "string" ? (record.error as string) : null;
  if (legacy) return legacy;

  const msg = record?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (
    Array.isArray(msg) &&
    msg.every((m): m is string => typeof m === "string")
  ) {
    return msg.join(", ") || fallback;
  }

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

export async function postAuthRegister(body: NestAuthRegisterBody) {
  return fetch(authUrl("/register"), {
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
