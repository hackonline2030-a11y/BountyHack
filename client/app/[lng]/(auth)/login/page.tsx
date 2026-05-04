import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { Section } from "@components/sections/Section";
import { LoginForm } from "@components/molecules/LoginForm";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("connexion", { lng });
  return { title: t("loginPage.metaTitle") };
}

export default async function LoginPage({ params }: PageProps) {
  const { lng } = await params;
  const { t } = await getT("connexion", { lng });

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-center bg-pattern"
      >
        <article className="flex w-full max-w-md flex-col items-center gap-6 px-5 py-8 sm:px-6">
          <h1 className="text-center text-3xl font-bold text-white">
            {t("loginPage.heading")}
          </h1>
          <LoginForm />
        </article>
      </Section>
    </main>
  );
}
