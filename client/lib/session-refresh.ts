/**
 * Renouvelle le JWT d'accès Next via le refresh opaque Nest (cookie httpOnly sur l'API auth).
 * Utilisé par le keep-alive et par {@link fetchBff} sur 401.
 */

import { messageFromNestBody, postAuthRefresh } from "@/lib/auth-api";
import { getSessionRefreshIntervalMs } from "@/lib/session-refresh.config";
import { localePrefixFromPathname } from "@/lib/locale-path";

/** Keep-alive period (see `NEXT_PUBLIC_SESSION_REFRESH_INTERVAL*` in `.env.example`). */
export const SESSION_REFRESH_INTERVAL_MS = getSessionRefreshIntervalMs();

export const SESSION_REFRESHED_EVENT = "bb-session-refreshed";

let refreshInFlight: Promise<boolean> | null = null;

export function localeFromBrowserPathname(): string {
  if (typeof window === "undefined") return "en";
  const prefix = localePrefixFromPathname(window.location.pathname);
  return prefix.replace(/^\//, "") || "en";
}

/**
 * Nest `POST …/auth/refresh` puis `POST /api/session` pour repousser le cookie `bb_access`.
 */
export async function refreshAppSession(lng?: string): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const locale = lng ?? localeFromBrowserPathname();

  refreshInFlight = (async () => {
    try {
      const refreshRes = await postAuthRefresh();
      let refreshData: unknown;
      try {
        refreshData = await refreshRes.json();
      } catch {
        refreshData = null;
      }

      if (!refreshRes.ok) {
        return false;
      }

      const token =
        refreshData &&
        typeof refreshData === "object" &&
        typeof (refreshData as Record<string, unknown>).token === "string"
          ? ((refreshData as Record<string, unknown>).token as string).trim()
          : "";
      if (!token) {
        return false;
      }

      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token, lng: locale }),
      });

      if (!sessionRes.ok) {
        return false;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(SESSION_REFRESHED_EVENT));
      }
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export function isUnauthorizedHttpError(message: string): boolean {
  return /unauthorized|401|invalid or expired token/i.test(message);
}

export function sessionExpiredUserMessage(): string {
  return "Session expirée. Reconnectez-vous depuis la page de connexion.";
}

/** Message d'erreur lisible pour les réponses Nest refresh échouées (debug). */
export function messageFromRefreshFailure(data: unknown): string {
  return messageFromNestBody(data, "Refresh failed");
}
