"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useElementHeightCssVar } from "@/modules/app/nextjs/hooks/useElementHeightCssVar";
import { LangLinks } from "@/modules/app/nextjs/layout/LangLinks";
import { logoutFromBrowser } from "@modules/auth/core/browser-logout.factory";
import {
  isAdministrationPath,
  isAuthHeaderLoginHighlightPath,
  localePrefixFromPathname,
} from "@/lib/locale-path";
import { SESSION_REFRESHED_EVENT } from "@/lib/session-refresh";

/** `/{lng}/welcome-…` segment for the signed-in role, or `null` when there is no dashboard route. */
function welcomeDashboardPathFromRoleCode(roleCode: string | null): string | null {
  if (!roleCode) return null;
  switch (roleCode) {
    case "SUPER_ADMIN":
      return "welcome-admin";
    case "HUNTER":
      return "welcome-hunter";
    case "MENTOR":
      return "welcome-mentor";
    case "QUALITY_CHECKER":
      return "welcome-quality-checker";
    case "COORDINATOR":
      return "welcome-coordinator";
    default:
      return null;
  }
}

export const Header: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { t } = useT("common");
  const router = useRouter();
  const pathname = usePathname();
  // Reflects /api/session/status. Drives both the username/role display
  // and the Logout-vs-Login switch (Parameters now lives in the in-app
  // dashboard sidebar — not the header).
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentRoleLabel, setCurrentRoleLabel] = useState<string | null>(null);
  const [currentRoleCode, setCurrentRoleCode] = useState<string | null>(null);
  const { ref } = useElementHeightCssVar({
    cssVarName: "--header-height",
    initialPx: 0,
    writeTo: "root",
  });

  const prefix = localePrefixFromPathname(pathname);
  const localeHome = prefix;
  const adminHref = `${prefix}/administration`;
  const loginHref = `${prefix}/login`;
  const isLoginActive = isAuthHeaderLoginHighlightPath(pathname);
  const isAdminActive = isAdministrationPath(pathname);
  const isSuperAdmin = currentRoleCode === "SUPER_ADMIN";
  const dashboardSegment = welcomeDashboardPathFromRoleCode(currentRoleCode);
  const dashboardHref =
    isAuthenticated && dashboardSegment ? `${prefix}/${dashboardSegment}` : null;
  const isDashboardActive =
    !!dashboardHref && (pathname === dashboardHref || pathname.startsWith(`${dashboardHref}/`));

  const roleLabelFromRoleCode = (roleCode: string | null): string | null => {
    if (!roleCode) return null;
    const labels: Record<string, string> = {
      SUPER_ADMIN: "Lead Bug Bounty",
      USER: "User",
      HUNTER: "Hunter",
      MENTOR: "Mentor",
      QUALITY_CHECKER: "Quality checker",
      COORDINATOR: "Coordinator",
      QUALITY_CONTENT: "Quality content",
    };
    return labels[roleCode] ?? roleCode.toLowerCase().replace(/_/g, " ");
  };

  useEffect(() => {
    let cancelled = false;
    async function loadSessionStatus(): Promise<void> {
      try {
        const res = await fetch("/api/session/status", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        const data: unknown = await res.json().catch(() => null);
        const authenticated =
          !!data &&
          typeof data === "object" &&
          (data as Record<string, unknown>).authenticated === true;
        const usernameRaw =
          !!data && typeof data === "object"
            ? (data as Record<string, unknown>).username
            : null;
        const roleRaw =
          !!data && typeof data === "object"
            ? (data as Record<string, unknown>).roleCode
            : null;
        const username =
          typeof usernameRaw === "string" && usernameRaw.trim().length > 0
            ? usernameRaw.trim()
            : null;
        const roleCode =
          typeof roleRaw === "string" && roleRaw.trim().length > 0
            ? roleRaw.trim()
            : null;
        if (!cancelled) {
          setIsAuthenticated(authenticated);
          setCurrentUsername(authenticated ? username : null);
          setCurrentRoleLabel(authenticated ? roleLabelFromRoleCode(roleCode) : null);
          setCurrentRoleCode(authenticated ? roleCode : null);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setCurrentUsername(null);
          setCurrentRoleLabel(null);
          setCurrentRoleCode(null);
        }
      }
    }
    void loadSessionStatus();

    const onSessionRefreshed = () => {
      void loadSessionStatus();
    };
    window.addEventListener(SESSION_REFRESHED_EVENT, onSessionRefreshed);

    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_REFRESHED_EVENT, onSessionRefreshed);
    };
  }, [pathname]);

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await logoutFromBrowser();
      setIsAuthenticated(false);
      setCurrentUsername(null);
      setCurrentRoleLabel(null);
      setCurrentRoleCode(null);
      router.replace(localeHome);
      router.refresh();
    } finally {
      setLogoutBusy(false);
    }
  }

  return (
    <header
      ref={ref}
      className="sticky top-0 z-20 w-full border-b border-black/10 bg-white/90 backdrop-blur"
    >
      <nav
        className={`header-container flex items-center justify-between gap-4 ${className}`.trim()}
      >
        <div className="flex flex-col items-start gap-0.5">
          <Link
            href={localeHome}
            className="text-lg font-bold tracking-tight text-black hover:text-black/70"
          >
            {t("header.brand")}
          </Link>
          {currentUsername ? (
            <span className="text-sm font-medium text-black/70">
              {currentUsername}
              {currentRoleLabel ? ` - ${currentRoleLabel}` : ""}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={localeHome} className="header-nav-link">
            {t("header.home")}
          </Link>
          {dashboardHref ? (
            <Link
              href={dashboardHref}
              aria-current={isDashboardActive ? "page" : undefined}
              className={`header-nav-link${isDashboardActive ? " header-nav-link--active" : ""}`}
            >
              {t("header.dashboard")}
            </Link>
          ) : null}
          <LangLinks />
          {isSuperAdmin ? (
            <Link
              href={adminHref}
              aria-current={isAdminActive ? "page" : undefined}
              className={`header-nav-link${isAdminActive ? " header-nav-link--active" : ""}`}
            >
              {t("header.admin")}
            </Link>
          ) : null}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={logoutBusy}
              className="header-nav-link"
            >
              {logoutBusy ? t("header.logoutPending") : t("header.logout")}
            </button>
          ) : (
            <Link
              href={loginHref}
              aria-current={isLoginActive ? "page" : undefined}
              className={`header-nav-link${isLoginActive ? " header-nav-link--active" : ""}`}
            >
              {t("header.login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
