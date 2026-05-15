import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { Section } from "@modules/app/nextjs/components/sections/Section";

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
        <article className="dashboard-card mx-auto max-w-2xl w-full px-6 py-10 text-center sm:py-12">
          <h1 className="text-4xl font-bold text-dashboard-text">{t("home.heroTitle")}</h1>
          <p className="mt-4 text-lg text-dashboard-text-muted">{t("home.heroLead")}</p>
          <p className="mt-6 text-sm text-dashboard-text-subtle">{t("home.heroHint")}</p>
        </article>
      </Section>
    </main>
  );
}
