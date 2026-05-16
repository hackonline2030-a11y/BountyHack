"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { localePrefixFromPathname } from "@/lib/locale-path";
import {
  SESSION_REFRESH_INTERVAL_MS,
  refreshAppSession,
} from "@/lib/session-refresh";

/**
 * Tant qu'une session est active, renouvelle le JWT d'accès avant expiration (~15m)
 * via le refresh opaque Nest. Évite les 401 silencieux sur les pages longues (QC, hunter).
 */
export const SessionKeepAlive: React.FC = () => {
  const pathname = usePathname();

  useEffect(() => {
    const lng = localePrefixFromPathname(pathname).replace(/^\//, "") || "en";

    async function isAuthenticated(): Promise<boolean> {
      try {
        const res = await fetch("/api/session/status", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data: unknown = await res.json().catch(() => null);
        return (
          !!data &&
          typeof data === "object" &&
          (data as Record<string, unknown>).authenticated === true
        );
      } catch {
        return false;
      }
    }

    async function tick() {
      if (!(await isAuthenticated())) return;
      await refreshAppSession(lng);
    }

    void tick();

    const intervalId = window.setInterval(() => {
      void tick();
    }, SESSION_REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
};
