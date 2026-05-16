import { NextRequest } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const { draftId } = await context.params;

  const nestRes = await fetchNestReportDraft(
    encodeURIComponent(draftId),
    auth.token,
    { method: "GET", cache: "no-store" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
