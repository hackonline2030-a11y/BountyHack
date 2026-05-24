import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { ResetPasswordForm } from "@/modules/auth/nextjs/components/forms/ResetPasswordForm";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ lng: string }>;
  searchParams: Promise<{ token?: string | string[]; flow?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    return {};
  }
  const { t } = await getT("passwordReset", { lng });
  return { title: t("resetPage.metaTitle") };
}

export default async function PasswordResetPage({ params, searchParams }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  const sp = await searchParams;
  const raw = sp.token;
  const tokenFromQuery =
    typeof raw === "string" ? raw : Array.isArray(raw) ? (raw[0] ?? "") : "";
  const rawFlow = sp.flow;
  const flow =
    typeof rawFlow === "string" ? rawFlow : Array.isArray(rawFlow) ? (rawFlow[0] ?? "") : "";
  const isAccountSetup = flow === "setup";

  const { t } = await getT("passwordReset", { lng });

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-center bg-pattern"
      >
        <article className="flex w-full max-w-md flex-col items-center gap-6 px-5 py-8 sm:px-6">
          <h1 className="text-center text-3xl font-bold text-white">
            {isAccountSetup ? t("resetPage.setupHeading") : t("resetPage.heading")}
          </h1>
          <p className="text-center text-sm text-white/85">
            {isAccountSetup ? t("resetPage.setupLead") : t("resetPage.lead")}
          </p>
          <ResetPasswordForm tokenFromQuery={tokenFromQuery} isAccountSetup={isAccountSetup} />
        </article>
      </Section>
    </main>
  );
}
