import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { getWelcomeUser } from "@/lib/dal/welcome-user";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { coordinatorPendingRequestsFixture, reportTeamsFixture } from "@modules/report-team/fixtures/report-team.fixtures";
import { ReportTeamMockBanner } from "@modules/report-team/react/ReportTeamMockBanner";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("welcomeCoordinator", { lng });
  return { title: t("welcomeCoordinator.metaTitle") };
}

export default async function WelcomeCoordinatorPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) notFound();
  await verifySessionForRoles(lng, [AppRoleCode.COORDINATOR]);

  const { displayName } = await getWelcomeUser(lng);
  const { t } = await getT(["welcomeCoordinator", "reportTeams"], { lng });
  const prefix = `/${lng}`;

  const heading =
    displayName !== null
      ? t("welcomeCoordinator.headingWithUsername", { username: displayName })
      : t("welcomeCoordinator.heading");

  const pendingCount = coordinatorPendingRequestsFixture.length;

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto w-full max-w-4xl flex flex-col gap-6">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-heading-on-pattern sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-1 text-sm text-dashboard-subheading-on-pattern sm:text-base">
              {t("welcomeCoordinator.subheading")}
            </p>
          </header>
          <ReportTeamMockBanner message={t("reportTeams:reportTeams.mockBanner")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="dashboard-card flex flex-col p-5">
              <h2 className="text-base font-semibold text-dashboard-text">
                {t("welcomeCoordinator.cards.pending.title")}
              </h2>
              <p className="mt-1 text-sm text-dashboard-text-muted">
                {pendingCount === 0
                  ? t("welcomeCoordinator.cards.pending.empty")
                  : t("welcomeCoordinator.cards.pending.subtitle", { n: pendingCount })}
              </p>
              <Link href={`${prefix}/coordination`} className="dashboard-card-cta mt-auto pt-4">
                {t("welcomeCoordinator.cards.pending.cta")} →
              </Link>
            </section>
            <section className="dashboard-card flex flex-col p-5">
              <h2 className="text-base font-semibold text-dashboard-text">
                {t("welcomeCoordinator.cards.teams.title")}
              </h2>
              <p className="mt-1 text-sm text-dashboard-text-muted">
                {t("welcomeCoordinator.cards.teams.subtitle", {
                  n: reportTeamsFixture.length,
                })}
              </p>
              <Link href={`${prefix}/coordination`} className="dashboard-card-cta mt-auto pt-4">
                {t("welcomeCoordinator.cards.teams.cta")} →
              </Link>
            </section>
            <section className="dashboard-card flex flex-col p-5 sm:col-span-2">
              <h2 className="text-base font-semibold text-dashboard-text">
                {t("welcomeCoordinator.cards.rules.title")}
              </h2>
              <p className="mt-2 text-sm text-dashboard-text-muted">
                {t("welcomeCoordinator.cards.rules.body")}
              </p>
            </section>
          </div>
        </div>
      </Section>
    </main>
  );
}
