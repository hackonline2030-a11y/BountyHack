import { NextRequest } from "next/server";
import { fetchNestReportDraft } from "@/lib/server/nest-report-draft-fetch";
import {
  jsonFromNestResponse,
  requireCoordinatorReportDraftBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const { draftId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonFromNestResponse(
      new Response(JSON.stringify({ message: "Invalid JSON" }), { status: 400 }),
      JSON.stringify({ message: "Invalid JSON" }),
    );
  }

  const nestRes = await fetchNestReportDraft(
    `draft/${encodeURIComponent(draftId)}/primary-hunter`,
    auth.token,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
