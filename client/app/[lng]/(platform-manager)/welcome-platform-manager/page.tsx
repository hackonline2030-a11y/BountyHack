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
  PlatformManagerSidebar,
  type PlatformManagerNavHrefs,
  type PlatformManagerNavLabels,
} from "./_components/PlatformManagerSidebar";

type PageProps = { params: Promise<{ lng: string }> };

const MISSION_KEYS = [
  "pedagogicalSite",
  "methodologicalResources",
  "internalDocs",
  "collaborativeTools",
  "feedbackCapitalization",
] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("welcomePlatformManager", { lng });
  return { title: t("welcomePlatformManager.metaTitle") };
}

export default async function WelcomePlatformManagerPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.QUALITY_CONTENT]);

  const { displayName } = await getWelcomeUser(lng);
  const { t } = await getT("welcomePlatformManager", { lng });
  const prefix = `/${lng}`;

  const heading =
    displayName !== null
      ? t("welcomePlatformManager.headingWithUsername", { username: displayName })
      : t("welcomePlatformManager.heading");

  const navLabels: PlatformManagerNavLabels = {
    label: t("welcomePlatformManager.nav.label"),
    settings: t("welcomePlatformManager.nav.settings"),
    credits: t("welcomePlatformManager.nav.credits"),
    criteria: t("welcomePlatformManager.nav.criteria"),
  };

  const navHrefs: PlatformManagerNavHrefs = {
    settings: `${prefix}/parameters`,
    credits: `${prefix}/credits`,
    criteria: `${prefix}/quality-criteria`,
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
              {t("welcomePlatformManager.subheading")}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <PlatformManagerSidebar labels={navLabels} hrefs={navHrefs} />

            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
              <DashboardCard
                titleId="card-mission"
                title={t("welcomePlatformManager.mission.title")}
              >
                <p className="text-sm text-dashboard-text">
                  {t("welcomePlatformManager.mission.intro")}
                </p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-dashboard-text-muted">
                  {MISSION_KEYS.map((key) => (
                    <li key={key}>
                      {t(`welcomePlatformManager.mission.items.${key}`)}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg border border-dashboard-divider bg-dashboard-accent-soft/50 px-3 py-2 text-xs text-dashboard-text-muted">
                  {t("welcomePlatformManager.mission.boundary")}
                </p>
              </DashboardCard>

              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <DashboardCard
                  titleId="card-pedagogical"
                  title={t("welcomePlatformManager.cards.pedagogicalSite.title")}
                  subtitle={t("welcomePlatformManager.cards.pedagogicalSite.subtitle")}
                  headerExtra={
                    <span className="shrink-0 rounded bg-dashboard-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-dashboard-accent">
                      {t("welcomePlatformManager.cards.comingSoon")}
                    </span>
                  }
                >
                  <p className="text-sm text-dashboard-text-muted">
                    {t("welcomePlatformManager.cards.pedagogicalSite.body")}
                  </p>
                </DashboardCard>

                <DashboardCard
                  titleId="card-resources"
                  title={t("welcomePlatformManager.cards.resources.title")}
                  subtitle={t("welcomePlatformManager.cards.resources.subtitle")}
                  headerExtra={
                    <span className="shrink-0 rounded bg-dashboard-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-dashboard-accent">
                      {t("welcomePlatformManager.cards.comingSoon")}
                    </span>
                  }
                >
                  <p className="text-sm text-dashboard-text-muted">
                    {t("welcomePlatformManager.cards.resources.body")}
                  </p>
                </DashboardCard>

                <DashboardCard
                  titleId="card-tools"
                  title={t("welcomePlatformManager.cards.tools.title")}
                  subtitle={t("welcomePlatformManager.cards.tools.subtitle")}
                  headerExtra={
                    <span className="shrink-0 rounded bg-dashboard-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-dashboard-accent">
                      {t("welcomePlatformManager.cards.comingSoon")}
                    </span>
                  }
                >
                  <p className="text-sm text-dashboard-text-muted">
                    {t("welcomePlatformManager.cards.tools.body")}
                  </p>
                </DashboardCard>

                <DashboardCard
                  titleId="card-settings"
                  title={t("welcomePlatformManager.cards.settings.title")}
                  subtitle={t("welcomePlatformManager.cards.settings.subtitle")}
                >
                  <p className="text-sm text-dashboard-text-muted">
                    {t("welcomePlatformManager.cards.settings.body")}
                  </p>
                  <Link href={navHrefs.settings} className="dashboard-card-cta mt-auto pt-4">
                    {t("welcomePlatformManager.cards.settings.cta")} →
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
