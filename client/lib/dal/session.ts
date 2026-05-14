import "server-only";

import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createRequireAppSessionDependencies } from "@modules/auth/core/auth.factory";
import { requireAppSessionUseCase } from "@modules/auth/core/usecase/require-app-session.usecase";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import type { AppRoleCode } from "@/lib/app-role-code";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import { extractRequestMetadata, logAuditEvent } from "@/lib/server/audit-log";

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

function roleCodeFromUsersMePayload(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const rc = (data as Record<string, unknown>).roleCode;
  return typeof rc === "string" && rc.trim() ? rc.trim() : null;
}

/**
 * Ensures an active access JWT cookie exists on the Next host (DAL pattern).
 * @see https://nextjs.org/docs/app/guides/authentication#create-a-data-access-layer-dal-with-only-the-data-you-need
 */
export const verifySession = cache(async (lng: string) => {
  const result = await requireAppSessionUseCase(
    createRequireAppSessionDependencies(),
  );

  if (!result.ok) {
    redirect(loginHref(lng));
  }

  return result.payload;
});

/**
 * Non-redirecting session probe for shared UI (e.g. header links).
 * Returns true only when the access cookie is present and valid.
 */
export async function hasValidSession(): Promise<boolean> {
  const result = await requireAppSessionUseCase(
    createRequireAppSessionDependencies(),
  );
  return result.ok;
}

/**
 * Session gate + RBAC using Nest **`GET …/users/me`** (`roleCode` from Postgres identity).
 *
 * Use on Server Components when a route must be limited to specific roles — pass one or several
 * {@link AppRoleCode} values; the user needs **any** of them (OR semantics).
 *
 * Behavior:
 * - Unauthenticated (no/invalid session cookie) → `redirect(/${lng}/login)` (inherited from `verifySession`).
 * - Authenticated but `roleCode ∉ allowedRoles` → **`notFound()`** (renders the 404 page).
 *
 * Why **`notFound()`** rather than `forbidden()`?
 *   `forbidden()` is still behind an experimental flag (`authInterrupts`) in Next.js 16 and is
 *   not recommended for production. A 404 also doesn't disclose that the route exists at all —
 *   an unauthorized hunter probing `/welcome-admin` gets exactly the same response as someone
 *   typing a random URL, which is the safer security posture for an app of this kind.
 *
 * @example Super-admin-only surface
 * ```ts
 * await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);
 * ```
 *
 * @example Hunter or mentor
 * ```ts
 * await verifySessionForRoles(lng, [AppRoleCode.HUNTER, AppRoleCode.MENTOR]);
 * ```
 */
export async function verifySessionForRoles(
  lng: string,
  allowedRoles: readonly AppRoleCode[],
): Promise<void> {
  if (!allowedRoles.length) {
    throw new Error("verifySessionForRoles: allowedRoles must be non-empty");
  }

  const payload = await verifySession(lng);

  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  if (!token) {
    redirect(loginHref(lng));
  }

  const res = await fetch(nestInternalApiUrl("users/me"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const requestMeta = extractRequestMetadata(await headers());
  const auditBase = {
    event: "rbac.denied",
    outcome: "deny" as const,
    userId: payload.sub,
    email: payload.email,
    allowedRoles: allowedRoles as readonly string[],
    ...requestMeta,
  };

  /**
   * 401 from Nest means the cookie JWT is stale/rejected → treat as
   * unauthenticated and bounce to login. Anything else (5xx, network/parse
   * failure, missing/unknown `roleCode`) → 404, because we cannot establish
   * that the user is allowed and must not fall through to another screen.
   */
  if (res.status === 401) {
    logAuditEvent({ ...auditBase, reason: "users_me_unauthorized" });
    redirect(loginHref(lng));
  }
  if (!res.ok) {
    logAuditEvent({
      ...auditBase,
      reason: "users_me_unreachable",
      roleCode: null,
    });
    notFound();
  }

  const data: unknown = await res.json().catch(() => null);
  const roleCode = roleCodeFromUsersMePayload(data);
  const allowed = new Set(allowedRoles);
  if (!roleCode || !allowed.has(roleCode as AppRoleCode)) {
    logAuditEvent({
      ...auditBase,
      reason: roleCode ? "role_mismatch" : "missing_role_code",
      roleCode,
    });
    notFound();
  }
}
