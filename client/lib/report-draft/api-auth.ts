import "server-only";

import { NextResponse } from "next/server";
import { createRequireAppSessionDependencies } from "@modules/auth/core/auth.factory";
import { sessionBearerForUpstreamUseCase } from "@modules/auth/core/usecase/session-bearer-for-upstream.usecase";
import { AppRoleCode } from "@/lib/app-role-code";
import { fetchRoleFromNest } from "@/lib/server/fetch-role-from-nest";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const REPORT_WORKFLOW_PARTICIPANT_ROLES: readonly AppRoleCode[] = [
  AppRoleCode.HUNTER,
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
  AppRoleCode.COORDINATOR,
  AppRoleCode.SUPER_ADMIN,
];

const REPORT_TEAM_MEMBER_ROLES: readonly AppRoleCode[] = [
  AppRoleCode.HUNTER,
  AppRoleCode.MENTOR,
  AppRoleCode.QUALITY_CHECKER,
  AppRoleCode.SUPER_ADMIN,
];

const COORDINATOR_OR_SUPER_ADMIN_ROLES: readonly AppRoleCode[] = [
  AppRoleCode.COORDINATOR,
  AppRoleCode.SUPER_ADMIN,
];

const SUPER_ADMIN_ONLY_ROLES: readonly AppRoleCode[] = [AppRoleCode.SUPER_ADMIN];

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

function forbiddenResponse(message: string) {
  return NextResponse.json(
    { message },
    { status: 403, headers: NO_STORE_HEADERS },
  );
}

/**
 * One session read + JWT verify → Nest bearer (httpOnly cookie never exposed to the browser).
 * Prefer this over calling {@link bearerTokenFromSessionOrUnauthorized} twice in the same handler.
 */
export async function requireReportDraftApiBearer(): Promise<
  { token: string } | { response: NextResponse }
> {
  const deps = createRequireAppSessionDependencies();
  const result = await sessionBearerForUpstreamUseCase(deps);
  if (!result.ok) {
    return { response: unauthorizedResponse() };
  }
  return { token: result.token };
}

async function requireBearerWithRoles(
  allowed: readonly AppRoleCode[],
  forbiddenMessage: string,
): Promise<{ token: string } | { response: NextResponse }> {
  const auth = await requireReportDraftApiBearer();
  if ("response" in auth) {
    return auth;
  }

  const role = await fetchRoleFromNest(auth.token);
  if (!role.ok) {
    return { response: unauthorizedResponse() };
  }

  if (!(allowed as readonly string[]).includes(role.roleCode)) {
    return { response: forbiddenResponse(forbiddenMessage) };
  }

  return { token: auth.token };
}

/** @deprecated Prefer {@link requireReportDraftApiBearer} or a role-specific helper below. */
export async function requireReportDraftApiSession(): Promise<
  { ok: true } | { response: NextResponse }
> {
  const auth = await requireReportDraftApiBearer();
  if ("response" in auth) {
    return { response: auth.response };
  }
  return { ok: true };
}

/** Hunter, mentor, QC, coordinator, or super admin — matches Nest `AuthReportWorkflowParticipant`. */
export async function requireReportWorkflowParticipantBearer(): Promise<
  { token: string } | { response: NextResponse }
> {
  return requireBearerWithRoles(
    REPORT_WORKFLOW_PARTICIPANT_ROLES,
    "Report workflow participant role required",
  );
}

/** Hunter, mentor, QC, or super admin — matches Nest `AuthReportTeamMember`. */
export async function requireReportTeamMemberBearer(): Promise<
  { token: string } | { response: NextResponse }
> {
  return requireBearerWithRoles(
    REPORT_TEAM_MEMBER_ROLES,
    "Hunter, mentor, or quality checker required",
  );
}

/** Coordinator / super-admin report-team management (create team, list applicants, etc.). */
export async function requireCoordinatorReportDraftBearer(): Promise<
  { token: string } | { response: NextResponse }
> {
  return requireBearerWithRoles(
    COORDINATOR_OR_SUPER_ADMIN_ROLES,
    "Coordinator or super admin required",
  );
}

/** Super-admin final validation actions (approve, request revision, comments). */
export async function requireSuperAdminReportDraftBearer(): Promise<
  { token: string } | { response: NextResponse }
> {
  return requireBearerWithRoles(SUPER_ADMIN_ONLY_ROLES, "Super admin required");
}

export function jsonFromNestResponse(nestRes: Response, body: string) {
  return new NextResponse(body, {
    status: nestRes.status,
    headers: {
      "Content-Type": "application/json",
      ...NO_STORE_HEADERS,
    },
  });
}
