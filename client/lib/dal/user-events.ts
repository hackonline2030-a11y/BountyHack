import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

export type UserEventType =
  | "username_changed"
  | "email_changed"
  | "password_changed";

export type UserEventDto = {
  id: string;
  userId: string;
  userDisplayName: string;
  eventType: UserEventType;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};

export type ListUserEventsResult =
  | { ok: true; items: UserEventDto[] }
  | { ok: false; reason: "unreachable" | "malformed_payload" };

function loginHref(lng: string): string {
  return `/${lng}/login`;
}

function isEventType(value: unknown): value is UserEventType {
  return (
    value === "username_changed" ||
    value === "email_changed" ||
    value === "password_changed"
  );
}

function normalizeEvent(raw: unknown): UserEventDto | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : null;
  const userId = typeof record.userId === "string" ? record.userId : null;
  const eventType = record.eventType;
  const createdAt =
    typeof record.createdAt === "string" ? record.createdAt : null;
  if (!id || !userId || !isEventType(eventType) || !createdAt) {
    return null;
  }
  return {
    id,
    userId,
    userDisplayName:
      typeof record.userDisplayName === "string"
        ? record.userDisplayName
        : userId,
    eventType,
    oldValue: typeof record.oldValue === "string" ? record.oldValue : null,
    newValue: typeof record.newValue === "string" ? record.newValue : null,
    createdAt,
  };
}

/**
 * Reads user profile change events from Nest `GET /notifications/user-events`.
 * Restricted server-side to COORDINATOR / SUPER_ADMIN by the Nest RolesGuard.
 * Call after verifying the session for the appropriate role.
 */
export const listUserEvents = cache(
  async (lng: string): Promise<ListUserEventsResult> => {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
    if (!token) {
      redirect(loginHref(lng));
    }

    try {
      const res = await fetch(nestInternalApiUrl("notifications/user-events"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (res.status === 401) {
        redirect(loginHref(lng));
      }

      if (!res.ok) {
        return { ok: false, reason: "unreachable" };
      }

      const data: unknown = await res.json().catch(() => null);
      const items = (data as { items?: unknown } | null)?.items;
      if (!Array.isArray(items)) {
        return { ok: false, reason: "malformed_payload" };
      }

      const normalized = items
        .map(normalizeEvent)
        .filter((event): event is UserEventDto => event !== null);
      return { ok: true, items: normalized };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },
);
