import { NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

/**
 * Lightweight session status for client UI (header/nav).
 * Never redirects; returns `authenticated` and optional profile fields.
 */
export async function GET() {
  const auth = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in auth) {
    return NextResponse.json(
      { authenticated: false, username: null, roleCode: null },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  let username: string | null = null;
  let roleCode: string | null = null;
  try {
    const me = await fetch(nestInternalApiUrl("users/me"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const data: unknown = await me.json().catch(() => null);
    const raw =
      data && typeof data === "object"
        ? (data as Record<string, unknown>).username
        : null;
    const rawRole =
      data && typeof data === "object"
        ? (data as Record<string, unknown>).roleCode
        : null;
    username =
      typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
    roleCode =
      typeof rawRole === "string" && rawRole.trim().length > 0
        ? rawRole.trim()
        : null;
  } catch {
    username = null;
    roleCode = null;
  }

  return NextResponse.json(
    { authenticated: true, username, roleCode },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
