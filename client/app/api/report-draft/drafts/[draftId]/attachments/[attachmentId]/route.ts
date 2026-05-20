import { NextRequest, NextResponse } from "next/server";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ draftId: string; attachmentId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const { draftId, attachmentId } = await context.params;
  const nestRes = await fetch(
    nestInternalApiUrl(
      `report-drafts/draft/${encodeURIComponent(draftId)}/attachments/${encodeURIComponent(attachmentId)}`,
    ),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
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
