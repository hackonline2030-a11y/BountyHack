import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createRequireAppSessionDependencies } from "@modules/auth/core/auth.factory";
import { requireAppSessionUseCase } from "@modules/auth/core/usecase/require-app-session.usecase";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import type { AppRoleCode } from "@/lib/app-role-code";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

function forbiddenHref(lng: string, relative: string): string {
  const seg = relative.replace(/^\/+/, "").replace(/\/+$/, "") || "welcome-dashboard";
  return `/${lng}/${seg}`;
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

export type VerifySessionForRolesOptions = {
  /**
   * Path after `/${lng}/` when the user is authenticated but their `roleCode`
   * is not in `allowedRoles` (default: `welcome-dashboard`).
   */
  forbiddenRelative?: string;
};

/**
 * Session gate + RBAC using Nest **`GET …/users/me`** (`roleCode` from Postgres identity).
 *
 * Use on Server Components when a route must be limited to specific roles — pass one or several
 * {@link AppRoleCode} values; the user needs **any** of them (OR semantics).
 *
 * @example Super-admin-only surface
 * ```ts
 * await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);
 * ```
 *
 * @example Hunter or mentor
 * ```ts
 * await verifySessionForRoles(lng, [AppRoleCode.HUNTER, AppRoleCode.MENTOR], {
 *   forbiddenRelative: "welcome-dashboard",
 * });
 * ```
 */
export async function verifySessionForRoles(
  lng: string,
  allowedRoles: readonly AppRoleCode[],
  options?: VerifySessionForRolesOptions,
): Promise<void> {
  if (!allowedRoles.length) {
    throw new Error("verifySessionForRoles: allowedRoles must be non-empty");
  }

  await verifySession(lng);

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

  if (!res.ok) {
    redirect(forbiddenHref(lng, options?.forbiddenRelative ?? "welcome-dashboard"));
  }

  const data: unknown = await res.json().catch(() => null);
  const roleCode = roleCodeFromUsersMePayload(data);
  const allowed = new Set(allowedRoles);
  if (!roleCode || !allowed.has(roleCode as AppRoleCode)) {
    redirect(forbiddenHref(lng, options?.forbiddenRelative ?? "welcome-dashboard"));
  }
}
