import { NextRequest } from "next/server";
import {
  jsonFromNestResponse,
  requireReportDraftApiBearer,
} from "@/lib/report-draft/api-auth";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export const dynamic = "force-dynamic";

/** Step 1 — verify current password before account deletion. */
export async function POST(request: NextRequest) {
  const auth = await requireReportDraftApiBearer();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonFromNestResponse(
      new Response(JSON.stringify({ message: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
      JSON.stringify({ message: "Invalid JSON body" }),
    );
  }

  const nestRes = await fetch(nestInternalApiUrl("users/me/account/verify-password"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
