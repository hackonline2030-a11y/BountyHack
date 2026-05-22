import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { getWelcomeUser } from "@/lib/dal/welcome-user";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import { DashboardCard } from "../../(mentor)/welcome-mentor/_components/DashboardCard";
import {
  CoordinatorDashboardSidebar,
  type CoordinatorNavHrefs,
  type CoordinatorNavLabels,
} from "./_components/CoordinatorDashboardSidebar";
import {
  coordinatorMessagesFixture,
  participantPulseFixture,
  pendingRequestsPreviewFixture,
  programNewsFixture,
  teamsOverviewFixture,
  workSessionsFixture,
  type ProgramNewsTag,
} from "./_data/fixtures";

type PageProps = { params: Promise<{ lng: string }> };

const MISSION_KEYS = [
  "workSessions",
  "taskDistribution",
  "contributions",
  "community",
  "mentorInterface",
] as const;

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
  const { t } = await getT("welcomeCoordinator", { lng });
  const { t: tTeams } = await getT("reportTeams", { lng });
  const prefix = `/${lng}`;

  const heading =
    displayName !== null
      ? t("welcomeCoordinator.headingWithUsername", { username: displayName })
      : t("welcomeCoordinator.heading");

  const navLabels: CoordinatorNavLabels = {
    label: t("welcomeCoordinator.nav.label"),
    coordination: t("welcomeCoordinator.nav.coordination"),
    teams: t("welcomeCoordinator.nav.teams"),
    criteria: t("welcomeCoordinator.nav.criteria"),
    support: t("welcomeCoordinator.nav.support"),
    settings: t("welcomeCoordinator.nav.settings"),
  };

  const navHrefs: CoordinatorNavHrefs = {
    coordination: `${prefix}/coordination`,
    teams: `${prefix}/coordination`,
    criteria: `${prefix}/quality-criteria`,
    support: `${prefix}/support`,
    settings: `${prefix}/parameters`,
  };

  const monthShortFormatter = new Intl.DateTimeFormat(lng, { month: "short" });
  const dayFormatter = new Intl.DateTimeFormat(lng, { day: "2-digit" });
  const dateTimeFormatter = new Intl.DateTimeFormat(lng, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatAgo = (minutes: number): string => {
    if (minutes < 60) return t("welcomeCoordinator.cards.messages.ago", { value: `${minutes} min` });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("welcomeCoordinator.cards.messages.ago", { value: `${hours} h` });
    return t("welcomeCoordinator.cards.messages.ago", { value: `${Math.floor(hours / 24)} j` });
  };

  const teamRoleLabel = (role: ReportTeamMemberRole): string =>
    tTeams(`reportTeams.roles.${role}`);

  const newsTagLabel = (tag: ProgramNewsTag): string => {
    if (tag === "announcement") return t("welcomeCoordinator.cards.news.tagAnnouncement");
    if (tag === "info") return t("welcomeCoordinator.cards.news.tagInfo");
    return t("welcomeCoordinator.cards.news.tagUpdate");
  };

  const validityLabel = (validity: "valid" | "incomplete"): string =>
    tTeams(`reportTeams.validity.${validity}`);

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
              {t("welcomeCoordinator.subheading")}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <CoordinatorDashboardSidebar labels={navLabels} hrefs={navHrefs} />

            <div className="grid min-w-0 flex-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex flex-col gap-4 sm:gap-5">
                <DashboardCard titleId="card-mission" title={t("welcomeCoordinator.mission.title")}>
                  <p className="text-sm text-dashboard-text">
                    {t("welcomeCoordinator.mission.intro")}
                  </p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-dashboard-text-muted">
                    {MISSION_KEYS.map((key) => (
                      <li key={key}>{t(`welcomeCoordinator.mission.items.${key}`)}</li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-lg border border-dashboard-divider bg-dashboard-accent-soft/50 px-3 py-2 text-xs text-dashboard-text-muted">
                    {t("welcomeCoordinator.mission.boundary")}
                  </p>
                </DashboardCard>

                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <DashboardCard
                    titleId="card-pending"
                    title={t("welcomeCoordinator.cards.pending.title")}
                    subtitle={
                      pendingRequestsPreviewFixture.length === 0
                        ? undefined
                        : t("welcomeCoordinator.cards.pending.subtitle", {
                            n: pendingRequestsPreviewFixture.length,
                          })
                    }
                  >
                    {pendingRequestsPreviewFixture.length === 0 ? (
                      <p className="text-sm text-dashboard-text-muted">
                        {t("welcomeCoordinator.cards.pending.empty")}
                      </p>
                    ) : (
                      <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                        {pendingRequestsPreviewFixture.map((req) => (
                          <li key={req.id} className="py-2 first:pt-0 last:pb-0">
                            <p className="text-sm font-medium text-dashboard-text">
                              {req.requesterDisplayName}
                            </p>
                            <p className="mt-0.5 text-xs text-dashboard-text-muted">
                              {req.kind === "join"
                                ? t("welcomeCoordinator.cards.pending.kindJoin")
                                : t("welcomeCoordinator.cards.pending.kindEnrollment")}{" "}
                              · {teamRoleLabel(req.requestedRole)} · {req.teamLabel}
                            </p>
                            <p className="mt-0.5 text-xs text-dashboard-text-subtle">
                              {formatAgo(req.requestedAgoMinutes)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={navHrefs.coordination} className="dashboard-card-cta mt-auto pt-4">
                      {t("welcomeCoordinator.cards.pending.cta")} →
                    </Link>
                  </DashboardCard>

                  <DashboardCard
                    titleId="card-teams"
                    title={t("welcomeCoordinator.cards.teams.title")}
                    subtitle={t("welcomeCoordinator.cards.teams.subtitle", {
                      n: teamsOverviewFixture.length,
                    })}
                  >
                    {teamsOverviewFixture.length === 0 ? (
                      <p className="text-sm text-dashboard-text-muted">
                        {t("welcomeCoordinator.cards.teams.empty")}
                      </p>
                    ) : (
                      <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                        {teamsOverviewFixture.map((team) => (
                          <li key={team.id} className="py-2 first:pt-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-dashboard-text">
                                {team.label}
                              </p>
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                  team.validity === "valid"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-amber-50 text-amber-900"
                                }`}
                              >
                                {validityLabel(team.validity)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-dashboard-text-muted">
                              {t("welcomeCoordinator.cards.teams.members", {
                                n: team.memberCount,
                              })}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={navHrefs.coordination} className="dashboard-card-cta mt-auto pt-4">
                      {t("welcomeCoordinator.cards.teams.cta")} →
                    </Link>
                  </DashboardCard>

                  <DashboardCard
                    titleId="card-participants"
                    title={t("welcomeCoordinator.cards.participants.title")}
                    subtitle={t("welcomeCoordinator.cards.participants.subtitle")}
                  >
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {participantPulseFixture.map((p) => (
                        <li key={p.id} className="py-2 first:pt-0 last:pb-0">
                          <p className="text-sm font-medium text-dashboard-text">{p.displayName}</p>
                          <p className="mt-0.5 text-xs text-dashboard-text-muted">{p.note}</p>
                        </li>
                      ))}
                    </ul>
                    <Link href={navHrefs.coordination} className="dashboard-card-cta mt-auto pt-4">
                      {t("welcomeCoordinator.cards.participants.cta")} →
                    </Link>
                  </DashboardCard>

                  <DashboardCard
                    titleId="card-messages"
                    title={t("welcomeCoordinator.cards.messages.title")}
                  >
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {coordinatorMessagesFixture.map((m) => (
                        <li key={m.id} className="py-2 first:pt-0 last:pb-0">
                          <p className="text-sm font-medium text-dashboard-text">{m.sender}</p>
                          <p className="line-clamp-1 text-xs text-dashboard-text-muted">
                            {m.preview}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <Link href={`${prefix}/messages`} className="dashboard-card-cta mt-auto pt-4">
                      {t("welcomeCoordinator.cards.messages.cta")} →
                    </Link>
                  </DashboardCard>

                  <DashboardCard
                    titleId="card-rules"
                    title={t("welcomeCoordinator.cards.rules.title")}
                    className="sm:col-span-2"
                  >
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeCoordinator.cards.rules.body")}
                    </p>
                  </DashboardCard>

                  <DashboardCard titleId="card-news" title={t("welcomeCoordinator.cards.news.title")}>
                    <ul role="list" className="flex flex-col gap-3">
                      {programNewsFixture.map((n) => (
                        <li key={n.id}>
                          <span className="inline-flex rounded bg-dashboard-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-dashboard-accent">
                            {newsTagLabel(n.tag)}
                          </span>
                          <p className="mt-1 line-clamp-2 text-sm text-dashboard-text">{n.title}</p>
                        </li>
                      ))}
                    </ul>
                  </DashboardCard>
                </div>
              </div>

              <DashboardCard
                titleId="card-agenda"
                title={t("welcomeCoordinator.cards.agenda.title")}
                subtitle={t("welcomeCoordinator.cards.agenda.subtitle")}
              >
                {workSessionsFixture.map((session) => {
                  const start = new Date(session.date);
                  return (
                    <div key={session.id} className="flex gap-3 py-2">
                      <time
                        dateTime={session.date}
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
                        <p className="text-sm font-medium text-dashboard-text">{session.title}</p>
                        <p className="text-xs text-dashboard-text-muted">
                          {dateTimeFormatter.format(start)} · {session.durationMin} min
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
