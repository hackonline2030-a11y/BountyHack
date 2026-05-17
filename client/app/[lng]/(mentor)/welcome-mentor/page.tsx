import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { getWelcomeUser } from "@/lib/dal/welcome-user";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import {
  DashboardSidebar,
  type DashboardNavHrefs,
  type DashboardNavLabels,
} from "./_components/DashboardSidebar";
import { DashboardCard } from "./_components/DashboardCard";
import {
  agendaFixture,
  casesToSupportFixture,
  messagesFixture,
  newsFixture,
  type NewsTag,
} from "./_data/fixtures";

type PageProps = { params: Promise<{ lng: string }> };

const MISSION_KEYS = [
  "methodology",
  "juniors",
  "impact",
  "security",
  "review",
] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("welcomeMentor", { lng });
  return { title: t("welcomeMentor.metaTitle") };
}

export default async function WelcomeMentorPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) notFound();
  await verifySessionForRoles(lng, [AppRoleCode.MENTOR]);

  const { displayName } = await getWelcomeUser(lng);
  const { t } = await getT("welcomeMentor", { lng });
  const prefix = `/${lng}`;

  const heading =
    displayName !== null
      ? t("welcomeMentor.headingWithUsername", { username: displayName })
      : t("welcomeMentor.heading");

  const navLabels: DashboardNavLabels = {
    label: t("welcomeMentor.nav.label"),
    emails: t("welcomeMentor.nav.emails"),
    reports: t("welcomeMentor.nav.reports"),
    teams: t("welcomeMentor.nav.teams"),
    colleagues: t("welcomeMentor.nav.colleagues"),
    support: t("welcomeMentor.nav.support"),
    settings: t("welcomeMentor.nav.settings"),
  };

  const navHrefs: DashboardNavHrefs = {
    emails: `${prefix}/emails`,
    reports: `${prefix}/mentor-team-reports`,
    teams: `${prefix}/mentor-teams`,
    colleagues: `${prefix}/colleagues`,
    support: `${prefix}/support`,
    settings: `${prefix}/parameters`,
  };

  const newsDateFormatter = new Intl.DateTimeFormat(lng, {
    day: "2-digit",
    month: "short",
  });
  const monthShortFormatter = new Intl.DateTimeFormat(lng, { month: "short" });
  const dayFormatter = new Intl.DateTimeFormat(lng, { day: "2-digit" });
  const dateTimeFormatter = new Intl.DateTimeFormat(lng, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatAgo = (minutes: number): string => {
    if (minutes < 60) return t("welcomeMentor.cards.messages.ago", { value: `${minutes} min` });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("welcomeMentor.cards.messages.ago", { value: `${hours} h` });
    return t("welcomeMentor.cards.messages.ago", { value: `${Math.floor(hours / 24)} j` });
  };

  const newsTagLabel = (tag: NewsTag): string => {
    if (tag === "announcement") return t("welcomeMentor.cards.news.tagAnnouncement");
    if (tag === "info") return t("welcomeMentor.cards.news.tagInfo");
    return t("welcomeMentor.cards.news.tagUpdate");
  };

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="dashboard-card mb-6 p-5 sm:mb-8 sm:p-6">
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-1 text-sm text-dashboard-text-muted sm:text-base">
              {t("welcomeMentor.subheading")}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <DashboardSidebar labels={navLabels} hrefs={navHrefs} />

            <div className="grid min-w-0 flex-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex flex-col gap-4 sm:gap-5">
                <DashboardCard titleId="card-mission" title={t("welcomeMentor.mission.title")}>
                  <p className="text-sm text-dashboard-text">{t("welcomeMentor.mission.intro")}</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-dashboard-text-muted">
                    {MISSION_KEYS.map((key) => (
                      <li key={key}>{t(`welcomeMentor.mission.items.${key}`)}</li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-lg border border-dashboard-divider bg-dashboard-accent-soft/50 px-3 py-2 text-xs text-dashboard-text-muted">
                    {t("welcomeMentor.mission.boundary")}
                  </p>
                </DashboardCard>

                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <DashboardCard
                    titleId="card-reports"
                    title={t("welcomeMentor.cards.reports.title")}
                    subtitle={t("welcomeMentor.cards.reports.subtitle", {
                      n: casesToSupportFixture.length,
                    })}
                  >
                    {casesToSupportFixture.length === 0 ? (
                      <p className="text-sm text-dashboard-text-muted">
                        {t("welcomeMentor.cards.reports.empty")}
                      </p>
                    ) : (
                      <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                        {casesToSupportFixture.map((c) => (
                          <li key={c.id} className="py-2 first:pt-0 last:pb-0">
                            <p className="text-sm font-medium text-dashboard-text">
                              <span className="text-dashboard-text-subtle">{c.reference}</span>{" "}
                              {c.title}
                            </p>
                            <p className="mt-0.5 text-xs text-dashboard-text-muted">
                              {c.hunter} · {formatAgo(c.submittedAgoMinutes)} ·{" "}
                              {t("welcomeMentor.cards.reports.stepLabel", {
                                current: c.step,
                                total: c.totalSteps,
                              })}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={navHrefs.reports} className="dashboard-card-cta mt-auto pt-4">
                      {t("welcomeMentor.cards.reports.cta")} →
                    </Link>
                  </DashboardCard>

                  <DashboardCard
                    titleId="card-teams"
                    title={t("welcomeMentor.cards.teams.title")}
                    subtitle={t("welcomeMentor.cards.teams.subtitle")}
                  >
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeMentor.cards.teams.description")}
                    </p>
                    <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
                      <Link href={navHrefs.teams} className="dashboard-card-cta">
                        {t("welcomeMentor.cards.teams.cta")} →
                      </Link>
                      <Link
                        href={`${navHrefs.teams}#ask-join`}
                        className="text-sm font-medium text-dashboard-accent hover:underline"
                      >
                        {t("welcomeMentor.cards.teams.askCta")} →
                      </Link>
                    </div>
                  </DashboardCard>

                  <DashboardCard
                    titleId="card-messages"
                    title={t("welcomeMentor.cards.messages.title")}
                  >
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {messagesFixture.map((m) => (
                        <li key={m.id} className="py-2 first:pt-0 last:pb-0">
                          <p className="text-sm font-medium text-dashboard-text">{m.sender}</p>
                          <p className="line-clamp-1 text-xs text-dashboard-text-muted">
                            {m.preview}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <Link href={`${prefix}/messages`} className="dashboard-card-cta mt-auto pt-4">
                      {t("welcomeMentor.cards.messages.cta")} →
                    </Link>
                  </DashboardCard>

                  <DashboardCard titleId="card-news" title={t("welcomeMentor.cards.news.title")}>
                    <ul role="list" className="flex flex-col gap-3">
                      {newsFixture.map((n) => (
                        <li key={n.id}>
                          <span className="inline-flex rounded bg-dashboard-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-dashboard-accent">
                            {newsTagLabel(n.tag)}
                          </span>
                          <p className="mt-1 line-clamp-2 text-sm text-dashboard-text">
                            {n.title}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </DashboardCard>
                </div>
              </div>

              <DashboardCard
                titleId="card-agenda"
                title={t("welcomeMentor.cards.agenda.title")}
                subtitle={t("welcomeMentor.cards.agenda.subtitle")}
              >
                {agendaFixture.map((a) => {
                  const start = new Date(a.date);
                  return (
                    <div key={a.id} className="flex gap-3 py-2">
                      <time
                        dateTime={a.date}
                        className="flex w-12 shrink-0 flex-col items-center rounded-md bg-dashboard-accent-soft px-1 py-1.5 text-dashboard-accent"
                      >
                        <span className="text-[10px] font-semibold uppercase">
                          {monthShortFormatter.format(start)}
                        </span>
                        <span className="text-base font-bold leading-none">
                          {dayFormatter.format(start)}
                        </span>
                      </time>
                      <div>
                        <p className="text-sm font-medium text-dashboard-text">{a.title}</p>
                        <p className="text-xs text-dashboard-text-muted">
                          {dateTimeFormatter.format(start)} · {a.durationMin} min
                        </p>
                      </div>
                    </div>
                  );
                })}
              </DashboardCard>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
