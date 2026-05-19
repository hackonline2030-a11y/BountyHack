import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireReportWorkflowParticipantBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ globalSubmissionId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireReportWorkflowParticipantBearer();
  if ("response" in auth) return auth.response;

  const { globalSubmissionId } = await context.params;
  const nestRes = await fetchNestReportDraft(
    `global-submissions/${encodeURIComponent(globalSubmissionId)}/comments`,
    auth.token,
    { method: "GET", cache: "no-store" },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
