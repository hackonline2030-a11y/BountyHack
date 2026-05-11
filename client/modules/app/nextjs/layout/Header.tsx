"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useElementHeightCssVar } from "@/modules/app/nextjs/hooks/useElementHeightCssVar";
import { LangLinks } from "@/modules/app/nextjs/layout/LangLinks";
import { logoutFromBrowser } from "@modules/auth/core/browser-logout.factory";
import {
  isAdministrationRegisterPath,
  isAuthLoginPath,
  isParametersPath,
  localePrefixFromPathname,
} from "@/lib/locale-path";

export const Header: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { t } = useT("common");
  const router = useRouter();
  const pathname = usePathname();
  const [showParametersLink, setShowParametersLink] = useState(false);
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
  const parametersHref = `${prefix}/parameters`;
  const adminHref = `${prefix}/administration/register`;
  const loginHref = `${prefix}/login`;
  const isLoginActive = isAuthLoginPath(pathname);
  const isParametersActive = isParametersPath(pathname);
  const isAdminActive = isAdministrationRegisterPath(pathname);
  const isSuperAdmin = currentRoleCode === "SUPER_ADMIN";

  const roleLabelFromRoleCode = (roleCode: string | null): string | null => {
    if (!roleCode) return null;
    const labels: Record<string, string> = {
      SUPER_ADMIN: "Super admin",
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
    async function loadSessionStatus() {
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
          setShowParametersLink(authenticated);
          setCurrentUsername(authenticated ? username : null);
          setCurrentRoleLabel(authenticated ? roleLabelFromRoleCode(roleCode) : null);
          setCurrentRoleCode(authenticated ? roleCode : null);
        }
      } catch {
        if (!cancelled) {
          setShowParametersLink(false);
          setCurrentUsername(null);
          setCurrentRoleLabel(null);
          setCurrentRoleCode(null);
        }
      }
    }
    void loadSessionStatus();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await logoutFromBrowser();
      setShowParametersLink(false);
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
        <Link
          href={localeHome}
          className="text-lg font-bold tracking-tight text-black hover:text-black/70"
        >
          {t("header.brand")}
          {currentUsername ? (
            <span className="ml-2 text-sm font-medium tracking-normal text-black/70">
              {currentUsername}
              {currentRoleLabel ? ` (${currentRoleLabel})` : ""}
            </span>
          ) : null}
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={localeHome}
            className="rounded-md px-3 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5 hover:text-black focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            {t("header.home")}
          </Link>
          <LangLinks />
          {showParametersLink ? (
            <Link
              href={parametersHref}
              className={`rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black/20 ${
                isParametersActive
                  ? "bg-black text-white"
                  : "text-black/70 hover:bg-black/5 hover:text-black"
              }`}
            >
              {t("header.parameters")}
            </Link>
          ) : null}
          {isSuperAdmin ? (
            <Link
              href={adminHref}
              className={`rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black/20 ${
                isAdminActive
                  ? "bg-black text-white"
                  : "text-black/70 hover:bg-black/5 hover:text-black"
              }`}
            >
              {t("header.admin")}
            </Link>
          ) : null}
          {showParametersLink ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={logoutBusy}
              className="rounded-md px-3 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5 hover:text-black focus:outline-none focus:ring-2 focus:ring-black/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {logoutBusy ? t("header.logoutPending") : t("header.logout")}
            </button>
          ) : (
            <Link
              href={loginHref}
              className={`rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black/20 ${
                isLoginActive
                  ? "bg-black text-white"
                  : "text-black/70 hover:bg-black/5 hover:text-black"
              }`}
            >
              {t("header.login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
