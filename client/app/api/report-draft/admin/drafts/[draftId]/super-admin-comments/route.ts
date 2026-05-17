import { NextRequest } from "next/server";
import {
  jsonFromNestResponse,
  requireSuperAdminReportDraftBearer,
} from "@/lib/report-draft/api-auth";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ draftId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireSuperAdminReportDraftBearer();
  if ("response" in auth) return auth.response;

  const { draftId } = await context.params;
  const body = await request.text();
  const nestRes = await fetch(
    nestInternalApiUrl(
      `report-drafts/admin/drafts/${encodeURIComponent(draftId)}/super-admin-comments`,
    ),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
