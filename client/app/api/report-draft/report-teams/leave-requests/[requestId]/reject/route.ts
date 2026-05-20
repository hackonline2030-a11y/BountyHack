import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireCoordinatorReportDraftBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ requestId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const { requestId } = await params;
  const nestRes = await fetchNestReportDraft(
    `report-teams/leave-requests/${encodeURIComponent(requestId)}/reject`,
    auth.token,
    { method: "POST" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
