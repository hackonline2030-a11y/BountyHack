import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/access-session.constants";
import { isSupportedLanguage } from "@/lib/auth/supported-language";
import { verifyAccessToken } from "@/lib/auth/verify-access-token.server";

/** Persists Nest access JWT on the Next origin (httpOnly); `lng` anchors localized redirects from DAL. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? body as Record<string, unknown> : null;
  const token = record?.token;
  const lng = record?.lng;

  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (typeof lng !== "string" || !isSupportedLanguage(lng)) {
    return NextResponse.json({ error: "Invalid lng" }, { status: 400 });
  }

  const verified = await verifyAccessToken(token.trim());
  if (!verified) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const maxAgeSeconds = Math.max(0, verified.expSeconds - nowSec);
  if (maxAgeSeconds === 0) {
    return NextResponse.json({ error: "Token already expired" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, token.trim(), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
