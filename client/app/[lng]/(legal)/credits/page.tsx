import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { CREDITS_CATALOG, CREDIT_CATEGORIES } from "@/lib/legal/credits-catalog";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    return {};
  }

  const { t } = await getT("credits", { lng });
  return { title: t("metaTitle") };
}

export default async function CreditsPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }

  const { t } = await getT("credits", { lng });

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-6">
      <article className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {t("title")}
        </h1>
        <p className="text-base leading-7 text-slate-700">{t("lead")}</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {t("groupsTitle")}
          </h2>
          <p className="text-sm text-slate-600">{t("groupsLead")}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {CREDIT_CATEGORIES.map((group) => (
              <section
                key={group}
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {t(`groups.${group}.title`)}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {t(`groups.${group}.description`)}
                </p>
                {CREDITS_CATALOG[group].length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {CREDITS_CATALOG[group].map((item) => (
                      <li
                        key={`${group}-${item.name}-${item.sourceUrl ?? "no-source"}`}
                        className="rounded-md border border-slate-200 bg-white p-3"
                      >
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                        <div className="mt-1 space-y-1 text-xs text-slate-600">
                          {item.author ? (
                            <p>
                              {t("entry.author")}: {item.author}
                            </p>
                          ) : null}
                          {item.sourceUrl ? (
                            <p>
                              {t("entry.source")}:{" "}
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2"
                              >
                                {item.sourceUrl}
                              </a>
                            </p>
                          ) : null}
                          {item.license ? (
                            <p>
                              {t("entry.license")}: {item.license}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
