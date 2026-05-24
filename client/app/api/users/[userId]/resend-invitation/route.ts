import { NextRequest } from "next/server";
import {
  jsonFromNestResponse,
  requireSuperAdminReportDraftBearer,
} from "@/lib/report-draft/api-auth";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireSuperAdminReportDraftBearer();
  if ("response" in auth) return auth.response;

  const { userId } = await context.params;
  const body = await request.text();

  const nestRes = await fetch(
    nestInternalApiUrl(`users/${encodeURIComponent(userId)}/resend-invitation`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      },
      body: body || "{}",
      cache: "no-store",
    },
  );
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
