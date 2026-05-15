import "server-only";

import { NextResponse } from "next/server";
import { bearerTokenFromSessionOrUnauthorized } from "@/lib/server/bearer-from-session";

export async function requireReportDraftApiSession(): Promise<
  { ok: true } | { response: NextResponse }
> {
  const auth = await bearerTokenFromSessionOrUnauthorized();
  if ("unauthorized" in auth) {
    return { response: auth.unauthorized };
  }
  return { ok: true };
}
