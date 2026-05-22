import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { fetchNestQuality } from "@/lib/server/nest-quality-fetch";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxy(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in auth) {
    return auth.unauthorized;
  }

  const { path = [] } = await context.params;
  const subPath = path.join("/");
  const query = request.nextUrl.search;
  const relative = subPath ? `${subPath}${query}` : query || "";

  const init: RequestInit = {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstream = await fetchNestQuality(relative, auth.token, init);
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
