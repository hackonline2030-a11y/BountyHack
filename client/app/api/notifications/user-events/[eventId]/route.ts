import { NextResponse } from "next/server";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import {
  jsonFromNestResponse,
  requireCoordinatorReportDraftBearer,
} from "@/lib/report-draft/api-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string }> };

/**
 * Backend-as-a-frontend proxy: deletes a user profile change event.
 * Only coordinators and super-admins may clear events (enforced here and by
 * the Nest RolesGuard). The httpOnly session cookie never reaches the browser.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireCoordinatorReportDraftBearer();
  if ("response" in auth) return auth.response;

  const { eventId } = await context.params;
  const nestRes = await fetch(
    nestInternalApiUrl(
      `notifications/user-events/${encodeURIComponent(eventId)}`,
    ),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const body = await nestRes.text();
  if (!nestRes.ok) {
    return jsonFromNestResponse(nestRes, body);
  }
  return new NextResponse(body, {
    status: nestRes.status,
    headers: {
      "Content-Type":
        nestRes.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
