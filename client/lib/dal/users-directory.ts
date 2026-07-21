import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export type UserDirectoryEntry = {
  uid: string;
  username: string;
  roleCode: string | null;
};

export type ListUsersDirectoryResult =
  | { ok: true; items: UserDirectoryEntry[] }
  | { ok: false; reason: "unreachable" | "malformed_payload" };

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

function normalizeEntry(raw: unknown): UserDirectoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.uid !== "string" || typeof record.username !== "string") {
    return null;
  }
  return {
    uid: record.uid,
    username: record.username,
    roleCode: typeof record.roleCode === "string" ? record.roleCode : null,
  };
}

export const listUsersDirectory = cache(
  async (lng: string): Promise<ListUsersDirectoryResult> => {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
    if (!token) redirect(loginHref(lng));

    try {
      const response = await fetch(nestInternalApiUrl("users/directory"), {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (response.status === 401) redirect(loginHref(lng));
      if (!response.ok) return { ok: false, reason: "unreachable" };

      const payload: unknown = await response.json().catch(() => null);
      const items = (payload as { items?: unknown } | null)?.items;
      if (!Array.isArray(items)) return { ok: false, reason: "malformed_payload" };

      return {
        ok: true,
        items: items
          .map(normalizeEntry)
          .filter((entry): entry is UserDirectoryEntry => entry !== null),
      };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },
);
