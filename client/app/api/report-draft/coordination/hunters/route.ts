import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import {
  jsonFromNestResponse,
  requireCoordinatorReportDraftBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const nestRes = await fetch(nestInternalApiUrl("report-drafts/coordination/hunters"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
