"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LOCALES = ["en", "fr"] as const;

function hrefForLocale(pathname: string, lng: (typeof LOCALES)[number]) {
  const match = pathname.match(/^\/(en|fr)(?=\/|$)/);
  if (match) return pathname.replace(/^\/(en|fr)/, `/${lng}`);
  return `/${lng}`;
}

export function LangLinks() {
  const pathname = usePathname() || "/";

  return (
    <div className="flex items-center gap-1 border-l border-black/10 pl-3 sm:pl-4">
      {LOCALES.map((lng) => {
        const active = new RegExp(`^/${lng}(?:/|$)`).test(pathname);
        return (
          <Link
            key={lng}
            href={hrefForLocale(pathname, lng)}
            className={
              active
                ? "rounded-md bg-black px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
                : "rounded-md px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-black/60 transition hover:bg-black/5 hover:text-black"
            }
            hrefLang={lng}
          >
            {lng}
          </Link>
        );
      })}
    </div>
  );
}
