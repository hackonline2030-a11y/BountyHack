"use client";

import { useMemo, useState } from "react";
import { useT } from "next-i18next/client";

export type UserEventType =
  | "username_changed"
  | "email_changed"
  | "password_changed";

export type UserEventItem = {
  id: string;
  userId: string;
  userDisplayName: string;
  eventType: UserEventType;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};

type UserEventsPanelProps = {
  initialEvents: UserEventItem[];
  /** When true, the initial server fetch failed; render an error banner. */
  loadError?: boolean;
};

function eventLabelKey(type: UserEventType): string {
  switch (type) {
    case "username_changed":
      return "types.usernameChanged";
    case "email_changed":
      return "types.emailChanged";
    case "password_changed":
      return "types.passwordChanged";
  }
}

export function UserEventsPanel({
  initialEvents,
  loadError = false,
}: UserEventsPanelProps) {
  const { t } = useT("userEvents");
  const [events, setEvents] = useState<UserEventItem[]>(initialEvents);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  async function handleDelete(eventId: string) {
    setError(null);
    setDeletingId(eventId);
    try {
      const res = await fetch(
        `/api/notifications/user-events/${encodeURIComponent(eventId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setError(t("deleteFailed"));
        return;
      }
      setEvents((current) => current.filter((event) => event.id !== eventId));
    } catch {
      setError(t("deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {t("loadError")}
      </div>
    );
  }

  return (
    <section aria-labelledby="user-events-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="user-events-heading"
          className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-subtle"
        >
          {t("heading")}
        </h2>
        <span className="text-xs text-dashboard-text-subtle">
          {t("count", { n: events.length })}
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-dashboard-divider px-4 py-6 text-center text-sm text-dashboard-text-muted">
          {t("empty")}
        </p>
      ) : (
        <ul
          role="list"
          className="max-h-96 overflow-y-auto rounded-lg border border-dashboard-divider divide-y divide-dashboard-divider"
        >
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-dashboard-text">
                  {event.userDisplayName}
                </p>
                <p className="mt-0.5 text-xs text-dashboard-text-muted">
                  {t(eventLabelKey(event.eventType))}
                  {event.oldValue && event.newValue ? (
                    <span className="text-dashboard-text-subtle">
                      {" "}
                      — {event.oldValue} → {event.newValue}
                    </span>
                  ) : null}
                </p>
                <time
                  dateTime={event.createdAt}
                  className="mt-0.5 block text-[11px] text-dashboard-text-subtle"
                >
                  {dateFormatter.format(new Date(event.createdAt))}
                </time>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(event.id)}
                disabled={deletingId === event.id}
                className="shrink-0 rounded-md border border-dashboard-divider px-2 py-1 text-xs font-medium text-dashboard-text-muted transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                {deletingId === event.id ? t("deleting") : t("delete")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
