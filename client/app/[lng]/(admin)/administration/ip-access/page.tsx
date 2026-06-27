import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "next-i18next/server";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { IpAccessAdminPage } from "@modules/ip-access/react/IpAccessAdminPage";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("ipAccess", { lng });
  return { title: t("ipAccess.metaTitle") };
}

export default async function AdministrationIpAccessPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-start bg-pattern py-10"
      >
        <IpAccessAdminPage lng={lng} />
      </Section>
    </main>
  );
}
