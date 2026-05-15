import { NextRequest } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireCoordinatorReportDraftBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const nestRes = await fetchNestReportDraft("report-teams", auth.token, {
    method: "GET",
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}

export async function POST(request: NextRequest) {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const bodyText = await request.text();
  const nestRes = await fetchNestReportDraft("report-teams", auth.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyText,
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
