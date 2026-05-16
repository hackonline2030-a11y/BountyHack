import { NextRequest, NextResponse } from "next/server";
import type { EstablishAppSessionResult } from "@modules/auth/core/model/auth.domain-model";
import {
  createDestroyAppSessionDependencies,
  createEstablishAppSessionDependencies,
} from "@modules/auth/core/auth.factory";
import { destroyAppSessionUseCase } from "@modules/auth/core/usecase/destroy-app-session.usecase";
import { establishAppSessionUseCase } from "@modules/auth/core/usecase/establish-app-session.usecase";
import { APP_LOGIN_ALLOWED_ROLES, AppRoleCode } from "@/lib/app-role-code";
import { fetchRoleFromNest } from "@/lib/server/fetch-role-from-nest";
import { extractRequestMetadata, logAuditEvent } from "@/lib/server/audit-log";

function mapEstablishOutcomeToResponse(
  result: EstablishAppSessionResult,
  roleCode: string,
): Response {
  switch (result.outcome) {
    case "success":
      return NextResponse.json({ ok: true, roleCode }, { status: 200 });
    case "invalid_lng":
      return NextResponse.json({ error: "Invalid lng" }, { status: 400 });
    case "token_expired":
    case "token_rejected":
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
  }
}

/**
 * Persists Nest access JWT on the Next origin (httpOnly); `lng` aligns with
 * `[lng]` routes for DAL redirects.
 *
 * Login-time role allow-list (security):
 *   We resolve `roleCode` from Nest **before** establishing the session and
 *   refuse to set the cookie for any role outside {@link APP_LOGIN_ALLOWED_ROLES}.
 *   This eliminates the create-then-revoke TOCTOU window we'd have if the
 *   client noticed the role mismatch after the cookie was already on the
 *   browser. On success we return `{ ok, roleCode }` so the client can route
 *   to the correct dashboard without a second `users/me` round-trip — the
 *   destination page still re-checks the role server-side (defense in depth).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  const token = typeof record?.token === "string" ? record.token.trim() : "";
  const lng = typeof record?.lng === "string" ? record.lng : "";

  if (!token) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  const roleResult = await fetchRoleFromNest(token);
  if (!roleResult.ok) {
    if (roleResult.kind === "unauthenticated") {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: "role_unreachable" },
      { status: 502 },
    );
  }

  const allowed = new Set<string>(APP_LOGIN_ALLOWED_ROLES as readonly AppRoleCode[]);
  if (!allowed.has(roleResult.roleCode)) {
    const meta = extractRequestMetadata(request.headers);
    logAuditEvent({
      event: "session.role_not_allowed",
      outcome: "deny",
      reason: "role_not_in_login_allow_list",
      roleCode: roleResult.roleCode,
      allowedRoles: APP_LOGIN_ALLOWED_ROLES as readonly string[],
      resource: "POST /api/session",
      ...meta,
    });
    return NextResponse.json(
      { error: "role_not_allowed", roleCode: roleResult.roleCode },
      { status: 403 },
    );
  }

  const deps = createEstablishAppSessionDependencies();
  const result = await establishAppSessionUseCase({ token, lng }, deps);

  return mapEstablishOutcomeToResponse(result, roleResult.roleCode);
}

/** Drops the short-lived access JWT cookie on the Next origin (after Nest `POST …/auth/logout` from the browser). */
export async function DELETE() {
  const deps = createDestroyAppSessionDependencies();
  await destroyAppSessionUseCase(deps);
  return NextResponse.json({ ok: true }, { status: 200 });
}
