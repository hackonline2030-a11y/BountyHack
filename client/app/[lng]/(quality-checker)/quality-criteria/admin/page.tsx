import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { QualityCriteriaAdminPage } from "@modules/quality/react/QualityCriteriaAdminPage";
import {
  DashboardSidebar,
  type DashboardNavHrefs,
  type DashboardNavLabels,
} from "../../welcome-quality-checker/_components/DashboardSidebar";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("quality", { lng });
  return { title: t("admin.title") };
}

export default async function QualityCriteriaAdminRoutePage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.QUALITY_CHECKER]);

  const { t } = await getT(["welcomeQualityChecker", "quality"], { lng });
  const prefix = `/${lng}`;

  const navLabels: DashboardNavLabels = {
    label: t("welcomeQualityChecker.nav.label"),
    emails: t("welcomeQualityChecker.nav.emails"),
    reports: t("welcomeQualityChecker.nav.reports"),
    teams: t("welcomeQualityChecker.nav.teams"),
    criteria: t("welcomeQualityChecker.nav.criteria"),
    colleagues: t("welcomeQualityChecker.nav.colleagues"),
    support: t("welcomeQualityChecker.nav.support"),
    settings: t("welcomeQualityChecker.nav.settings"),
  };

  const navHrefs: DashboardNavHrefs = {
    emails: `${prefix}/emails`,
    reports: `${prefix}/team-reports`,
    teams: `${prefix}/qc-teams`,
    criteria: `${prefix}/quality-criteria/admin`,
    colleagues: `${prefix}/colleagues`,
    support: `${prefix}/support`,
    settings: `${prefix}/parameters`,
  };

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <DashboardSidebar
            labels={navLabels}
            hrefs={navHrefs}
            activeKey="criteria"
          />
          <QualityCriteriaAdminPage lng={lng} />
        </div>
      </Section>
    </main>
  );
}
