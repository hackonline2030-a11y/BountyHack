import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireCoordinatorReportDraftBearer,
} from "@/lib/report-draft/api-auth";

type RouteContext = { params: Promise<{ requestId: string }> };

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const { requestId } = await context.params;
  const nestRes = await fetchNestReportDraft(
    `report-teams/join-requests/${encodeURIComponent(requestId)}/reject`,
    auth.token,
    { method: "POST", cache: "no-store" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
