"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const LOCALES = ["en", "fr"] as const;
type Locale = (typeof LOCALES)[number];

/** Short labels displayed in the button and the menu — keep them uppercase. */
const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

/**
 * Decorative locale flag. The accompanying text label carries the meaning, so
 * the image is marked `alt=""` + `aria-hidden` to avoid screen-reader noise.
 */
function LocaleFlag({ locale }: { locale: Locale }) {
  return (
    <Image
      src={`/flags/${locale}.webp`}
      alt=""
      aria-hidden
      width={20}
      height={14}
      className="shrink-0 rounded-[2px] object-cover"
    />
  );
}

const LOCALE_PATH_REGEXP = /^\/(en|fr)(?=\/|$)/;

function hrefForLocale(pathname: string, lng: Locale): string {
  if (LOCALE_PATH_REGEXP.test(pathname)) {
    return pathname.replace(LOCALE_PATH_REGEXP, `/${lng}`);
  }
  return `/${lng}`;
}

/** Reads the current locale from the pathname; falls back to `fr` if absent. */
function activeLocaleFromPathname(pathname: string): Locale {
  const match = pathname.match(LOCALE_PATH_REGEXP);
  return (match?.[1] as Locale | undefined) ?? "fr";
}

/**
 * Custom locale switcher: a single button that toggles a dropdown panel below it.
 *
 * Built as a hand-rolled disclosure (not a native `<select>`, not a third-party
 * menu library) so the dropdown can be styled freely as the design evolves.
 */
export function LangLinks() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const active = activeLocaleFromPathname(pathname);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative border-l border-black/10 pl-3 sm:pl-4"
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Changer la langue (actuelle : ${LOCALE_LABELS[active]})`}
        onClick={() => setOpen((current) => !current)}
        className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-black/70 transition hover:bg-black/5 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
      >
        <LocaleFlag locale={active} />
        {LOCALE_LABELS[active]}
        <span
          aria-hidden
          className={`text-[0.6rem] leading-none transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Langues disponibles"
          className="absolute right-0 top-full z-30 mt-2 min-w-20 overflow-hidden rounded-md border border-black/10 bg-white shadow-lg"
        >
          {LOCALES.map((lng) => {
            const isActive = lng === active;
            const baseItemClass =
              "flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black/40";
            const stateClass = isActive
              ? "font-bold text-black bg-black/5"
              : "font-medium text-black/70 hover:bg-black/5 hover:text-black";
            return (
              <Link
                key={lng}
                href={hrefForLocale(pathname, lng)}
                hrefLang={lng}
                role="menuitem"
                aria-current={isActive ? "true" : undefined}
                onClick={close}
                className={`${baseItemClass} ${stateClass}`}
              >
                <LocaleFlag locale={lng} />
                {LOCALE_LABELS[lng]}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
