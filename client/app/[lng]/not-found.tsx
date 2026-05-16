import Link from "next/link";
import { headers } from "next/headers";
import { getT } from "next-i18next/server";
import i18nConfig from "@/i18n.config";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";

export default async function NotFound() {
  const rawLng = (await headers()).get("x-i18next-current-language")?.trim();
  const lng =
    rawLng && isSupportedLanguage(rawLng) ? rawLng : i18nConfig.fallbackLng ?? "en";
  const { t } = await getT("common", { lng });
  const homeHref = `/${lng}`;

  return (
    <main className="flex min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] w-full flex-col">
      <Section
        fluid
        classNames="flex-1 flex flex-col items-center justify-center bg-pattern px-4 py-10 sm:px-6 sm:py-12"
      >
        <article className="dashboard-card mx-auto w-full max-w-lg px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-muted">
            {t("notFound.kicker")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-dashboard-text sm:text-4xl">
            {t("notFound.title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-dashboard-text-muted">
            {t("notFound.description")}
          </p>
          <div className="mt-8">
            <Link href={homeHref} className="dashboard-card-cta inline-flex">
              {t("notFound.ctaHome")}
            </Link>
          </div>
        </article>
      </Section>
    </main>
  );
}
