import {
  applyRateLimitHeaders,
  checkBffRateLimit,
} from "@/lib/server/bff-rate-limit";
import { createProxy } from "next-i18next/proxy";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import i18nConfig from "./i18n.config";

const i18nProxy = createProxy(i18nConfig);

export async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
): Promise<NextResponse> {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const result = await checkBffRateLimit(request);

    if (result.pending) {
      event.waitUntil(result.pending);
    }

    if (!result.success) {
      const res = NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
      applyRateLimitHeaders(res.headers, result);
      return res;
    }

    const res = NextResponse.next();
    applyRateLimitHeaders(res.headers, result);
    return res;
  }

  return i18nProxy(request);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest|manifest.webmanifest).*)",
  ],
};
