import { NextRequest, NextResponse } from "next/server";
import {
  jsonFromNestResponse,
  requireSuperAdminReportDraftBearer,
} from "@/lib/report-draft/api-auth";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxy(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSuperAdminReportDraftBearer();
  if ("response" in auth) {
    return auth.response;
  }

  const { path = [] } = await context.params;
  const subPath = path.join("/");
  const query = request.nextUrl.search;
  const relative = subPath ? `${subPath}${query}` : query || "";

  const init: RequestInit = {
    method: request.method,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstream = await fetch(
    nestInternalApiUrl(relative ? `ip-access/admin/${relative}` : "ip-access/admin"),
    init,
  );
  const body = await upstream.text();
  return jsonFromNestResponse(upstream, body);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
