"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "next-i18next/client";
import { useElementHeightCssVar } from "@modules/app/react/hooks/useElementHeightCssVar";
import { LangLinks } from "@modules/app/react/layout/LangLinks";
import {
  isAuthLoginPath,
  isAuthRegisterPath,
  localePrefixFromPathname,
} from "@/lib/locale-path";

export const Header: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { t } = useT("common");
  const pathname = usePathname();
  const { ref } = useElementHeightCssVar({
    cssVarName: "--header-height",
    initialPx: 0,
    writeTo: "root",
  });

  const prefix = localePrefixFromPathname(pathname);
  const localeHome = prefix;
  const loginHref = `${prefix}/login`;
  const registerHref = `${prefix}/register`;
  const isLoginActive = isAuthLoginPath(pathname);
  const isRegisterActive = isAuthRegisterPath(pathname);

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
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={localeHome}
            className="rounded-md px-3 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5 hover:text-black focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            {t("header.home")}
          </Link>
          <LangLinks />
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
          <Link
            href={registerHref}
            className={`rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black/20 ${
              isRegisterActive
                ? "bg-black text-white"
                : "text-black/70 hover:bg-black/5 hover:text-black"
            }`}
          >
            {t("header.register")}
          </Link>
        </div>
      </nav>
    </header>
  );
};
