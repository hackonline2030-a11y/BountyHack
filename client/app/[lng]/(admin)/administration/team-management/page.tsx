import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { ReportTeamAdminBootstrap } from "@modules/report-team/react/ReportTeamAdminBootstrap";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("reportTeams", { lng });
  return { title: t("reportTeams.admin.metaTitle") };
}

export default async function TeamManagementPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) notFound();
  await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);

  const { t } = await getT("reportTeams", { lng });
  const prefix = `/${lng}`;

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="dashboard-card flex flex-col gap-6 p-5 sm:p-6">
            <Link href={`${prefix}/welcome-admin`} className="dashboard-card-cta w-fit text-sm">
              ← {t("reportTeams.backToDashboard")}
            </Link>
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-dashboard-text sm:text-3xl">
                {t("reportTeams.admin.heading")}
              </h1>
              <p className="mt-1 text-sm text-dashboard-text-muted sm:text-base">
                {t("reportTeams.admin.subheading")}
              </p>
            </header>
            <div className="border-t border-dashboard-divider pt-6">
              <ReportTeamAdminBootstrap />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
