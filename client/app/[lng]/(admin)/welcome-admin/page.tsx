import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { getWelcomeUser } from "@/lib/dal/welcome-user";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { DashboardCard } from "../../(mentor)/welcome-mentor/_components/DashboardCard";
import {
  AdminDashboardSidebar,
  type AdminNavHrefs,
  type AdminNavLabels,
} from "./_components/AdminDashboardSidebar";

type PageProps = { params: Promise<{ lng: string }> };

const MISSION_KEYS = [
  "ywhAccount",
  "ywhRelations",
  "finalValidation",
  "submission",
  "legalFinancial",
  "arbitration",
] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("welcomeAdmin", { lng });
  return { title: t("welcomeAdmin.metaTitle") };
}

export default async function WelcomeAdminPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);
  const { displayName } = await getWelcomeUser(lng);
  const { t } = await getT("welcomeAdmin", { lng });
  const prefix = `/${lng}`;

  const heading =
    displayName !== null
      ? t("welcomeAdmin.headingWithUsername", { username: displayName })
      : t("welcomeAdmin.heading");

  const navLabels: AdminNavLabels = {
    label: t("welcomeAdmin.nav.label"),
    users: t("welcomeAdmin.nav.users"),
    register: t("welcomeAdmin.nav.register"),
    teams: t("welcomeAdmin.nav.teams"),
    settings: t("welcomeAdmin.nav.settings"),
  };

  const navHrefs: AdminNavHrefs = {
    users: `${prefix}/administration`,
    register: `${prefix}/administration/register`,
    teams: `${prefix}/administration/team-management`,
    settings: `${prefix}/parameters`,
  };

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="dashboard-card mb-6 p-5 sm:mb-8 sm:p-6">
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-1 text-sm text-dashboard-text-muted sm:text-base">
              {t("welcomeAdmin.subheading")}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <AdminDashboardSidebar labels={navLabels} hrefs={navHrefs} />

            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
              <DashboardCard titleId="card-mission" title={t("welcomeAdmin.mission.title")}>
                <p className="text-sm text-dashboard-text">{t("welcomeAdmin.mission.intro")}</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-dashboard-text-muted">
                  {MISSION_KEYS.map((key) => (
                    <li key={key}>{t(`welcomeAdmin.mission.items.${key}`)}</li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg border border-dashboard-divider bg-dashboard-accent-soft/50 px-3 py-2 text-xs text-dashboard-text-muted">
                  {t("welcomeAdmin.mission.boundary")}
                </p>
              </DashboardCard>

              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <DashboardCard
                  titleId="card-users"
                  title={t("welcomeAdmin.cards.users.title")}
                  subtitle={t("welcomeAdmin.cards.users.subtitle")}
                >
                  <p className="text-sm text-dashboard-text-muted">
                    {t("welcomeAdmin.cards.users.body")}
                  </p>
                  <Link href={navHrefs.users} className="dashboard-card-cta mt-auto pt-4">
                    {t("welcomeAdmin.cards.users.cta")} →
                  </Link>
                </DashboardCard>

                <DashboardCard
                  titleId="card-register"
                  title={t("welcomeAdmin.cards.register.title")}
                  subtitle={t("welcomeAdmin.cards.register.subtitle")}
                >
                  <p className="text-sm text-dashboard-text-muted">
                    {t("welcomeAdmin.cards.register.body")}
                  </p>
                  <Link href={navHrefs.register} className="dashboard-card-cta mt-auto pt-4">
                    {t("welcomeAdmin.cards.register.cta")} →
                  </Link>
                </DashboardCard>

                <DashboardCard
                  titleId="card-teams"
                  title={t("welcomeAdmin.cards.teams.title")}
                  subtitle={t("welcomeAdmin.cards.teams.subtitle")}
                  className="sm:col-span-2"
                >
                  <p className="text-sm text-dashboard-text-muted">
                    {t("welcomeAdmin.cards.teams.body")}
                  </p>
                  <Link href={navHrefs.teams} className="dashboard-card-cta mt-auto pt-4">
                    {t("welcomeAdmin.cards.teams.cta")} →
                  </Link>
                </DashboardCard>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
