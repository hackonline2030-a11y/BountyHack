import { NextRequest, NextResponse } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const { draftId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nestRes = await fetchNestReportDraft(
    `${encodeURIComponent(draftId)}/hunter-writer`,
    auth.token,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
