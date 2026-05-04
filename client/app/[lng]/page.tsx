import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { Section } from "@components/sections/Section";

type PageProps = {
  params: Promise<{ lng: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("common", { lng });
  return {
    title: t("home.metaTitle"),
  };
}

export default async function Home({ params }: PageProps) {
  const { lng } = await params;
  const { t } = await getT("common", { lng });

  return (
    <main className="flex min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] w-full flex-col">
      <Section
        fluid
        classNames="flex-1 flex flex-col items-center justify-center bg-pattern"
      >
        <article className="max-w-2xl w-full px-6 py-12 text-center text-white">
          <h1 className="text-4xl font-bold">{t("home.heroTitle")}</h1>
          <p className="mt-4 text-lg text-white/90">{t("home.heroLead")}</p>
          <p className="mt-6 text-sm text-white/80">{t("home.heroHint")}</p>
        </article>
      </Section>
    </main>
  );
}
