import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export type ParametersProfileDto = {
  twoFactorEnabled: boolean;
};

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

function twoFactorEnabledFromProfile(data: unknown): boolean {
  if (!data || typeof data !== "object") {
    return false;
  }
  return (data as Record<string, unknown>).twoFactorEnabled === true;
}

/**
 * Reads `twoFactorEnabled` from Nest `GET /users/me` (Prisma exposes it). Call after `verifySession(lng)`.
 */
export const getParametersProfile = cache(
  async (lng: string): Promise<ParametersProfileDto> => {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
    if (!token) {
      redirect(loginHref(lng));
    }

    try {
      const res = await fetch(nestInternalApiUrl("users/me"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return { twoFactorEnabled: false };
      }

      const data: unknown = await res.json().catch(() => null);
      return { twoFactorEnabled: twoFactorEnabledFromProfile(data) };
    } catch {
      return { twoFactorEnabled: false };
    }
  },
);
