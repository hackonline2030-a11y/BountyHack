import { NextRequest, NextResponse } from "next/server";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import { requireReportWorkflowParticipantBearer } from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ draftId: string; attachmentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const { draftId, attachmentId } = await context.params;
  const nestRes = await fetch(
    nestInternalApiUrl(
      `report-drafts/draft/${encodeURIComponent(draftId)}/attachments/${encodeURIComponent(
        attachmentId,
      )}/image`,
    ),
    {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    },
  );

  const body = await nestRes.arrayBuffer();
  return new NextResponse(body, {
    status: nestRes.status,
    headers: {
      "Content-Type": nestRes.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": nestRes.headers.get("Content-Disposition") ?? "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
