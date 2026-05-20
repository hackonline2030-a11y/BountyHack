import { NextRequest, NextResponse } from "next/server";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const { draftId } = await context.params;
  const formData = await request.formData();
  const nestRes = await fetch(
    nestInternalApiUrl(
      `report-drafts/draft/${encodeURIComponent(draftId)}/attachments/images`,
    ),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
      body: formData,
      cache: "no-store",
    },
  );

  const body = await nestRes.text();
  if (!nestRes.ok) {
    return jsonFromNestResponse(nestRes, body);
  }
  return new NextResponse(body, {
    status: nestRes.status,
    headers: {
      "Content-Type": nestRes.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
