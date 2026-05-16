import { headers } from "next/headers";
import { getT } from "next-i18next/server";
import i18nConfig from "@/i18n.config";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";

/**
 * Instant loading fallback for localized routes (`/[lng]/…`).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default async function Loading() {
  const rawLng = (await headers()).get("x-i18next-current-language")?.trim();
  const lng =
    rawLng && isSupportedLanguage(rawLng) ? rawLng : i18nConfig.fallbackLng ?? "en";
  const { t } = await getT("common", { lng });

  return (
    <main className="flex min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] w-full flex-col">
      <Section
        fluid
        classNames="flex flex-1 flex-col items-center justify-center bg-pattern px-4 py-16 sm:px-6 sm:py-24"
      >
        <div
          className="dashboard-card flex w-full max-w-md flex-col items-center gap-6 px-8 py-10 sm:py-11"
          role="status"
          aria-busy="true"
          aria-live="polite"
        >
          <span
            className="inline-block size-11 shrink-0 animate-spin rounded-full border-2 border-dashboard-accent-soft border-t-dashboard-accent"
            aria-hidden
          />
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <p className="text-sm font-semibold text-dashboard-text">
              {t("loading.pageTitle")}
            </p>
            <p className="text-xs text-dashboard-text-muted">{t("loading.pageHint")}</p>
          </div>
          <div className="flex w-full flex-col gap-2" aria-hidden>
            <span className="h-2 w-full animate-pulse rounded-full bg-dashboard-accent-soft" />
            <span className="mx-auto h-2 w-2/3 animate-pulse rounded-full bg-dashboard-accent-soft/80" />
            <span className="mx-auto h-2 w-1/3 animate-pulse rounded-full bg-dashboard-accent-soft/60" />
          </div>
        </div>
      </Section>
    </main>
  );
}
