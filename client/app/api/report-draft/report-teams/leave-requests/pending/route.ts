import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireCoordinatorReportDraftBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const nestRes = await fetchNestReportDraft(
    "report-teams/leave-requests/pending",
    auth.token,
    { method: "GET", cache: "no-store" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
