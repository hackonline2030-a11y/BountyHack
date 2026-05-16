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
        classNames="flex-1 flex flex-col items-center justify-center bg-pattern px-4 py-10 sm:px-6 sm:py-12"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
          <article className="dashboard-card px-6 py-10 text-center sm:py-12">
            <h1 className="text-4xl font-bold text-dashboard-text">{t("home.heroTitle")}</h1>
            <p className="mt-4 text-lg text-dashboard-text-muted">{t("home.heroLead")}</p>
            <p className="mt-6 text-sm text-dashboard-text-subtle">{t("home.heroHint")}</p>
          </article>
          <aside
            className="dashboard-card px-5 py-4 text-center text-sm leading-relaxed text-dashboard-text sm:px-6 sm:py-5"
            role="note"
          >
            <p className="m-0">{t("home.demoNotice")}</p>
          </aside>
        </div>
      </Section>
    </main>
  );
}
