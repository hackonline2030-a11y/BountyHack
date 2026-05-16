import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

/**
 * BFF: `POST …/auth/register` with Bearer from httpOnly session — required because
 * Nest restricts registration to SUPER_ADMIN and the browser cannot read the JWT.
 */
export async function POST(request: NextRequest) {
  const auth = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in auth) {
    return auth.unauthorized;
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const res = await fetch(nestInternalApiUrl("auth/register"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
      "Content-Type": request.headers.get("Content-Type") ?? "application/json",
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}
