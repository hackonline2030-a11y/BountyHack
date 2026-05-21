import { NextRequest } from "next/server";
import {
  jsonFromNestResponse,
  requireReportDraftApiBearer,
} from "@/lib/report-draft/api-auth";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export const dynamic = "force-dynamic";

/** Self-service account deletion (any authenticated user). */
export async function DELETE(_request: NextRequest) {
  const auth = await requireReportDraftApiBearer();
  if ("response" in auth) return auth.response;

  const nestRes = await fetch(nestInternalApiUrl("users/me/account"), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  return jsonFromNestResponse(nestRes, await nestRes.text());
}
