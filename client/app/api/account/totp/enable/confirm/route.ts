import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

/**
 * BFF: `POST …/auth/totp/enable/confirm` on Nest with `{ code }` (6–8 digits, per Nest DTO).
 */
export async function POST(request: NextRequest) {
  const auth = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in auth) {
    return auth.unauthorized;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  const rawCode = typeof record?.code === "string" ? record.code.replace(/\s/g, "") : "";
  if (!/^\d{6,8}$/.test(rawCode)) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const res = await fetch(nestInternalApiUrl("auth/totp/enable/confirm"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: rawCode }),
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
