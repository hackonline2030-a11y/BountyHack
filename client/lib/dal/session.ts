import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/access-session.constants";
import { verifyAccessToken } from "@/lib/auth/verify-access-token.server";

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

/**
 * Ensures an active access JWT cookie exists on the Next host (DAL pattern).
 * @see https://nextjs.org/docs/app/guides/authentication#create-a-data-access-layer-dal-with-only-the-data-you-need
 */
export const verifySession = cache(async (lng: string) => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  if (!raw?.trim()) {
    redirect(loginHref(lng));
  }

  const verified = await verifyAccessToken(raw.trim());
  if (!verified) {
    cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
    redirect(loginHref(lng));
  }

  return verified;
});
