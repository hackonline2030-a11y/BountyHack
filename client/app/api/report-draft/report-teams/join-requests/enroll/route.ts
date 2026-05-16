import { NextRequest } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireReportTeamMemberBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireReportTeamMemberBearer();
  if ("response" in auth) return auth.response;

  const bodyText = await request.text();

  const nestRes = await fetchNestReportDraft(
    "report-teams/join-requests/enroll",
    auth.token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
      cache: "no-store",
    },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
