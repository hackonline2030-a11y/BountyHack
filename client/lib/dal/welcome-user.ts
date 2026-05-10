import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";
import { verifySession } from "@/lib/dal/session";

/** Canonical display name from `GET /users/me` only; `null` if none. */
export type WelcomeUserDto = {
  displayName: string | null;
};

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

function usernameFromProfileJson(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const username = (data as Record<string, unknown>).username;
  if (typeof username !== "string") {
    return null;
  }
  const trimmed = username.trim();
  return trimmed || null;
}

function noPseudoLogAndReturn(): WelcomeUserDto {
  console.log("Aucun pseudo trouvé");
  return { displayName: null };
}

/**
 * Verifies session, loads profile from Nest `GET /users/me`.
 * Username for the UI comes only from the API response (no JWT/email fallback).
 */
export const getWelcomeDashboardUser = cache(
  async (lng: string): Promise<WelcomeUserDto> => {
    await verifySession(lng);

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
        return noPseudoLogAndReturn();
      }

      const data: unknown = await res.json().catch(() => null);
      const username = usernameFromProfileJson(data);
      if (!username) {
        return noPseudoLogAndReturn();
      }

      return { displayName: username };
    } catch {
      return noPseudoLogAndReturn();
    }
  },
);
