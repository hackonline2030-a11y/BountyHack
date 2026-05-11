import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  if (!isSupportedLanguage(lng) || lng !== "fr") {
    return {};
  }
  const { t } = await getT("legal", { lng });
  return { title: t("notice.metaTitle") };
}

export default async function LegalNoticeFrPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng) || lng !== "fr") {
    notFound();
  }
  const { t } = await getT("legal", { lng });

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6">
      <article className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {t("notice.title")}
        </h1>
        <p className="text-base leading-7 text-slate-700">{t("notice.body")}</p>
      </article>
    </main>
  );
}
