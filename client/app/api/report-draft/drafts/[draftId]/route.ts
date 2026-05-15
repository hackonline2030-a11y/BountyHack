import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import { requireReportDraftApiSession } from "@/lib/report-draft/api-auth";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireReportDraftApiSession();
  if ("response" in auth) return auth.response;

  const { draftId } = await context.params;

  const bearer = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in bearer) return bearer.unauthorized;

  const nestRes = await fetchNestReportDraft(
    encodeURIComponent(draftId),
    bearer.token,
    { method: "GET" },
  );

  const body = await nestRes.text();
  return new NextResponse(body, {
    status: nestRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
