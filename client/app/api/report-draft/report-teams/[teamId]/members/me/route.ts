import { NextRequest } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ teamId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const { teamId } = await context.params;

  const nestRes = await fetchNestReportDraft(
    `report-teams/${encodeURIComponent(teamId)}/members/me`,
    auth.token,
    { method: "DELETE", cache: "no-store" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
