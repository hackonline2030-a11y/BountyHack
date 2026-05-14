import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import { createListAdminUsersDependencies } from "@modules/admin/core/admin-users.factory";
import { listAdminUsersUseCase } from "@modules/admin/core/usecase/list-admin-users.usecase";
import type { AdminUserSummary } from "@modules/admin/core/model/admin-users.domain-model";

/**
 * Result surface consumed by the admin page. We narrow the use-case outcome
 * here because the DAL already handled the `unauthorized` branch (redirect to
 * login) and the page only needs to render either a table or a localised
 * error banner.
 */
export type ListAdminUsersForPageResult =
  | { ok: true; items: readonly AdminUserSummary[] }
  | { ok: false; reason: "unreachable" | "malformed_payload" };

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

/**
 * Server-only Next.js glue around {@link listAdminUsersUseCase}.
 *
 * Responsibilities — kept deliberately narrow:
 *   1. Read the `bb_access` cookie from `next/headers`.
 *   2. If missing → `redirect()` to login (no point fetching with no token).
 *   3. Invoke the framework-agnostic use case.
 *   4. Translate `reason: "unauthorized"` from the use case into a login
 *      redirect (Nest rejected the JWT) — same UX as a missing cookie.
 *   5. Forward `ok` / `unreachable` / `malformed_payload` to the page,
 *      which renders a typed error banner.
 *
 * Everything HTTP-shaped (`fetch`, URL building, JSON parsing, role
 * sanitisation) lives in the use case + gateway-infra under
 * `modules/admin/core/`. The DAL has **no** business logic of its own.
 */
export const listAdminUsers = cache(
  async (lng: string): Promise<ListAdminUsersForPageResult> => {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
    if (!token) {
      redirect(loginHref(lng));
    }

    const result = await listAdminUsersUseCase(
      { token },
      createListAdminUsersDependencies(),
    );

    if (result.ok) {
      return { ok: true, items: result.items };
    }

    if (result.reason === "unauthorized") {
      redirect(loginHref(lng));
    }
    return { ok: false, reason: result.reason };
  },
);
