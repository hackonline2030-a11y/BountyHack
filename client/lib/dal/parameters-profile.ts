import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export type ParametersProfileDto = {
  uid: string;
  username: string;
  email: string | null;
  twoFactorEnabled: boolean;
  roleCode: string | null;
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

function roleCodeFromProfile(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const raw = (data as Record<string, unknown>).roleCode;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function stringField(data: unknown, key: string): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const raw = (data as Record<string, unknown>)[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function emailFromProfile(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const raw = (data as Record<string, unknown>).email;
  if (raw === null || raw === undefined) {
    return null;
  }
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
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
        return {
          uid: "",
          username: "",
          email: null,
          twoFactorEnabled: false,
          roleCode: null,
        };
      }

      const data: unknown = await res.json().catch(() => null);
      return {
        uid: stringField(data, "uid") ?? "",
        username: stringField(data, "username") ?? "",
        email: emailFromProfile(data),
        twoFactorEnabled: twoFactorEnabledFromProfile(data),
        roleCode: roleCodeFromProfile(data),
      };
    } catch {
      return {
        uid: "",
        username: "",
        email: null,
        twoFactorEnabled: false,
        roleCode: null,
      };
    }
  },
);
