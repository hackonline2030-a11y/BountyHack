import { NextRequest } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireCoordinatorReportDraftBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ teamId: string; memberUserId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const { teamId, memberUserId } = await context.params;

  const nestRes = await fetchNestReportDraft(
    `report-teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberUserId)}`,
    auth.token,
    { method: "DELETE", cache: "no-store" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
