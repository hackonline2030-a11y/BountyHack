import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { DeleteOwnAccountPanel } from "@/modules/auth/nextjs/components/parameters/DeleteOwnAccountPanel";
import { TotpEnrollmentPanel } from "@/modules/auth/nextjs/components/parameters/TotpEnrollmentPanel";
import { getParametersProfile } from "@/lib/dal/parameters-profile";
import { verifySession } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("parameters", { lng });
  return { title: t("metaTitle") };
}

export default async function ParametersPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySession(lng);
  const profile = await getParametersProfile(lng);
  const { t } = await getT("parameters", { lng });

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col bg-slate-50">
      <Section fluid classNames="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-lg">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("pageTitle")}
          </h1>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t("securityHeading")}
          </h2>
          <div className="mt-4">
            <TotpEnrollmentPanel initialTotpEnabled={profile.twoFactorEnabled} />
          </div>
          <DeleteOwnAccountPanel roleCode={profile.roleCode} />
        </div>
      </Section>
    </main>
  );
}
