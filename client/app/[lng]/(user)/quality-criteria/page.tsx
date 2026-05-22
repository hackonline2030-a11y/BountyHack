import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { AppRoleCode } from "@/lib/app-role-code";
import { getParametersProfile } from "@/lib/dal/parameters-profile";
import { QUALITY_CRITERIA_READER_ROLES } from "@/lib/quality-role-sets";
import { verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { QualityCriteriaCatalogPage } from "@modules/quality/react/QualityCriteriaCatalogPage";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("quality", { lng });
  return { title: t("catalog.title") };
}

export default async function QualityCriteriaCatalogRoutePage({
  params,
}: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [...QUALITY_CRITERIA_READER_ROLES]);
  const profile = await getParametersProfile(lng);
  const manageHref =
    profile.roleCode === AppRoleCode.QUALITY_CHECKER
      ? `/${lng}/quality-criteria/admin`
      : null;

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section fluid classNames="flex flex-1 flex-col bg-pattern py-6 px-4 sm:px-6">
        <QualityCriteriaCatalogPage lng={lng} manageHref={manageHref} />
      </Section>
    </main>
  );
}
