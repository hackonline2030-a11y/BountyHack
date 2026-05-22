"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import i18nConfig from "@/i18n.config";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

/**
 * Route segment error UI for `/{lng}/…` (App Router error boundary).
 * Must be a Client Component; keeps root layout (header / footer) visible.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  const { t } = useT("common");
  const router = useRouter();
  const pathname = usePathname();
  const rawSeg = pathname?.split("/").filter(Boolean)[0];
  const lng =
    rawSeg && isSupportedLanguage(rawSeg)
      ? rawSeg
      : i18nConfig.fallbackLng ?? "en";
  const homeHref = `/${lng}`;

  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  /** Re-fetch Server Components (e.g. after API was down); `reset()` alone does not. */
  const handleRetry = useCallback(() => {
    router.refresh();
    reset?.();
  }, [router, reset]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <main className="flex min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] w-full flex-col">
      <Section
        fluid
        classNames="flex flex-1 flex-col items-center justify-center bg-pattern px-4 py-10 sm:px-6 sm:py-12"
      >
        <article className="dashboard-card mx-auto w-full max-w-lg px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-muted">
            {t("routeError.kicker")}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-dashboard-text sm:text-3xl">
            {t("routeError.title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-dashboard-text-muted">
            {t("routeError.description")}
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-dashboard-text-subtle">
              {t("routeError.digestLabel")}: {error.digest}
            </p>
          ) : null}
          {isDev && error.message ? (
            <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-left font-mono text-xs text-rose-900">
              <span className="font-semibold">{t("routeError.devMessage")}: </span>
              {error.message}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {reset ? (
              <button type="button" onClick={handleRetry} className="btn-common-styles btn-primary">
                {t("routeError.retry")}
              </button>
            ) : null}
            <Link
              href={homeHref}
              className="btn-common-styles inline-flex items-center justify-center border border-dashboard-card-border bg-white px-5 py-2.5 text-sm font-medium text-dashboard-text shadow-sm hover:bg-dashboard-accent-soft/60"
            >
              {t("notFound.ctaHome")}
            </Link>
          </div>
        </article>
      </Section>
    </main>
  );
}
