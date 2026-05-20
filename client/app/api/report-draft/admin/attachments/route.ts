import { NextResponse } from "next/server";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import {
  jsonFromNestResponse,
  requireSuperAdminReportDraftBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdminReportDraftBearer();
  if ("response" in auth) return auth.response;

  const nestRes = await fetch(nestInternalApiUrl("report-drafts/admin/attachments"), {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await nestRes.text();
  if (!nestRes.ok) {
    return jsonFromNestResponse(nestRes, body);
  }
  return new NextResponse(body, {
    status: nestRes.status,
    headers: {
      "Content-Type": nestRes.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
