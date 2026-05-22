"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useElementHeightCssVar } from "@/modules/app/nextjs/hooks/useElementHeightCssVar";
import { LangLinks } from "@/modules/app/nextjs/layout/LangLinks";
import { logoutFromBrowser } from "@modules/auth/core/browser-logout.factory";
import {
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
    case "QUALITY_CONTENT":
      return "welcome-platform-manager";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { ref } = useElementHeightCssVar({
    cssVarName: "--header-height",
    initialPx: 0,
    writeTo: "root",
  });

  const prefix = localePrefixFromPathname(pathname);
  const localeHome = prefix;
  const loginHref = `${prefix}/login`;
  const isLoginActive = isAuthHeaderLoginHighlightPath(pathname);
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
      QUALITY_CONTENT: "Tools & content lead",
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await logoutFromBrowser();
      setIsAuthenticated(false);
      setCurrentUsername(null);
      setCurrentRoleLabel(null);
      setCurrentRoleCode(null);
      setMobileMenuOpen(false);
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
        <div className="min-w-0 flex flex-col items-start gap-0.5">
          <Link
            href={localeHome}
            className="text-lg font-bold tracking-tight text-black hover:text-black/70"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t("header.brand")}
          </Link>
          {currentUsername ? (
            <span className="max-w-[70vw] truncate text-sm font-medium text-black/70 md:max-w-none">
              {currentUsername}
              {currentRoleLabel ? ` - ${currentRoleLabel}` : ""}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md border border-black/10 text-black/80 transition hover:bg-black/5 hover:text-black focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none md:hidden"
          aria-label={
            mobileMenuOpen
              ? t("header.closeMenu")
              : t("header.openMenu")
          }
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-header-menu"
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          <span className="sr-only">
            {mobileMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
          </span>
          <span className="flex h-4 w-5 flex-col justify-between" aria-hidden>
            <span
              className={`h-0.5 rounded-full bg-current transition-transform ${
                mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 rounded-full bg-current transition-opacity ${
                mobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-0.5 rounded-full bg-current transition-transform ${
                mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
        <div className="hidden items-center gap-2 md:flex lg:gap-3">
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
      {mobileMenuOpen ? (
        <div
          id="mobile-header-menu"
          className="border-t border-black/10 bg-white shadow-lg md:hidden"
        >
          <div className="header-container flex flex-col gap-2 py-3">
            <Link
              href={localeHome}
              className="header-mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("header.home")}
            </Link>
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                aria-current={isDashboardActive ? "page" : undefined}
                className={`header-mobile-nav-link${
                  isDashboardActive ? " header-mobile-nav-link--active" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("header.dashboard")}
              </Link>
            ) : null}
            <div className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2">
              <span className="text-sm font-medium text-black/70">
                {t("header.language")}
              </span>
              <LangLinks />
            </div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={logoutBusy}
                className="header-mobile-nav-link text-left disabled:cursor-not-allowed disabled:opacity-50"
              >
                {logoutBusy ? t("header.logoutPending") : t("header.logout")}
              </button>
            ) : (
              <Link
                href={loginHref}
                aria-current={isLoginActive ? "page" : undefined}
                className={`header-mobile-nav-link${
                  isLoginActive ? " header-mobile-nav-link--active" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("header.login")}
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};
