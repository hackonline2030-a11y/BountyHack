import { NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

/**
 * BFF: `POST …/auth/totp/enable/start` on Nest using the session cookie (no JWT in browser).
 */
export async function POST() {
  const auth = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in auth) {
    return auth.unauthorized;
  }

  const res = await fetch(nestInternalApiUrl("auth/totp/enable/start"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
    },
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
