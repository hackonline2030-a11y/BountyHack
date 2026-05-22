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
  chatRoomsFixture,
  colleaguesFixture,
  messagesFixture,
  newsFixture,
  reportsToCheckFixture,
  type ColleagueRole,
  type ColleagueStatus,
  type NewsTag,
  type ReportPriority,
} from "./_data/fixtures";

type PageProps = { params: Promise<{ lng: string }> };

const MISSION_KEYS = [
  "reproducibility",
  "scope",
  "duplicates",
  "harmonization",
  "finalValidation",
] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("welcomeQualityChecker", { lng });
  return { title: t("welcomeQualityChecker.metaTitle") };
}

export default async function WelcomeQualityCheckerPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.QUALITY_CHECKER]);

  const { displayName } = await getWelcomeUser(lng);
  const { t } = await getT("welcomeQualityChecker", { lng });

  const heading =
    displayName !== null
      ? t("welcomeQualityChecker.headingWithUsername", { username: displayName })
      : t("welcomeQualityChecker.heading");

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

  /**
   * Placeholder hrefs — only `/parameters` exists today. Others are wired
   * to sensible mock paths so the markup is link-correct; replace as
   * features land.
   */
  const navHrefs: DashboardNavHrefs = {
    emails: `${prefix}/emails`,
    reports: `${prefix}/team-reports`,
    teams: `${prefix}/qc-teams`,
    criteria: `${prefix}/quality-criteria/admin`,
    colleagues: `${prefix}/colleagues`,
    support: `${prefix}/support`,
    settings: `${prefix}/parameters`,
  };

  const monthShortFormatter = new Intl.DateTimeFormat(lng, { month: "short" });
  const dayFormatter = new Intl.DateTimeFormat(lng, { day: "2-digit" });
  const newsDateFormatter = new Intl.DateTimeFormat(lng, { day: "2-digit", month: "short" });
  const dateTimeFormatter = new Intl.DateTimeFormat(lng, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatRelativeAgo = (minutes: number): string => {
    if (minutes < 60) return t("welcomeQualityChecker.cards.messages.ago", { value: `${minutes} min` });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("welcomeQualityChecker.cards.messages.ago", { value: `${hours} h` });
    const days = Math.floor(hours / 24);
    return t("welcomeQualityChecker.cards.messages.ago", { value: `${days} j` });
  };

  const formatSubmittedAgo = (minutes: number): string => {
    if (minutes < 60) return t("welcomeQualityChecker.cards.reports.submittedAgo", { value: `${minutes} min` });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("welcomeQualityChecker.cards.reports.submittedAgo", { value: `${hours} h` });
    const days = Math.floor(hours / 24);
    return t("welcomeQualityChecker.cards.reports.submittedAgo", { value: `${days} j` });
  };

  const newsTagLabel = (tag: NewsTag): string => {
    if (tag === "announcement") return t("welcomeQualityChecker.cards.news.tagAnnouncement");
    if (tag === "info") return t("welcomeQualityChecker.cards.news.tagInfo");
    return t("welcomeQualityChecker.cards.news.tagUpdate");
  };

  const priorityLabel = (priority: ReportPriority): string => {
    if (priority === "high") return t("welcomeQualityChecker.cards.reports.priorityHigh");
    if (priority === "medium") return t("welcomeQualityChecker.cards.reports.priorityMedium");
    return t("welcomeQualityChecker.cards.reports.priorityLow");
  };

  const colleagueRoleLabel = (role: ColleagueRole): string => {
    if (role === "mentor") return t("welcomeQualityChecker.cards.colleagues.roleMentor");
    if (role === "lead") return t("welcomeQualityChecker.cards.colleagues.roleLead");
    return t("welcomeQualityChecker.cards.colleagues.roleQualityChecker");
  };

  const colleagueStatusLabel = (status: ColleagueStatus): string => {
    if (status === "online") return t("welcomeQualityChecker.cards.colleagues.statusOnline");
    if (status === "away") return t("welcomeQualityChecker.cards.colleagues.statusAway");
    return t("welcomeQualityChecker.cards.colleagues.statusOffline");
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
              {t("welcomeQualityChecker.subheading")}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <DashboardSidebar labels={navLabels} hrefs={navHrefs} />

            <div className="grid min-w-0 flex-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-4 sm:gap-5">
                <DashboardCard
                  titleId="card-mission"
                  title={t("welcomeQualityChecker.mission.title")}
                >
                  <p className="text-sm text-dashboard-text">
                    {t("welcomeQualityChecker.mission.intro")}
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-dashboard-text-muted">
                    {t("welcomeQualityChecker.mission.responsibilitiesTitle")}
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-dashboard-text-muted">
                    {MISSION_KEYS.map((key) => (
                      <li key={key}>{t(`welcomeQualityChecker.mission.items.${key}`)}</li>
                    ))}
                  </ul>
                </DashboardCard>

                <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                {/* Rapports à vérifier */}
                <DashboardCard
                  titleId="card-reports"
                  title={t("welcomeQualityChecker.cards.reports.title")}
                  subtitle={t("welcomeQualityChecker.cards.reports.subtitle", { n: reportsToCheckFixture.length })}
                >
                  {reportsToCheckFixture.length === 0 ? (
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeQualityChecker.cards.reports.empty")}
                    </p>
                  ) : (
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {reportsToCheckFixture.slice(0, 3).map((r) => {
                        const stepPercent = Math.max(
                          0,
                          Math.min(100, Math.round((r.step / r.totalSteps) * 100)),
                        );
                        return (
                          <li key={r.id} className="py-2 first:pt-0 last:pb-0">
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 truncate text-sm font-medium text-dashboard-text">
                                <span className="text-dashboard-text-subtle">{r.reference}</span>{" "}
                                <span>{r.title}</span>
                              </p>
                              <span
                                aria-label={priorityLabel(r.priority)}
                                className="shrink-0 rounded-full bg-dashboard-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dashboard-accent"
                              >
                                {priorityLabel(r.priority)}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-dashboard-text-muted">
                              <span className="truncate">
                                {r.hunter} · {formatSubmittedAgo(r.submittedAgoMinutes)}
                              </span>
                              <span className="shrink-0 text-dashboard-text-subtle">
                                {t("welcomeQualityChecker.cards.reports.stepLabel", {
                                  current: r.step,
                                  total: r.totalSteps,
                                })}
                              </span>
                            </div>
                            <div
                              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-dashboard-accent-soft"
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={stepPercent}
                              aria-label={t("welcomeQualityChecker.cards.reports.stepLabel", {
                                current: r.step,
                                total: r.totalSteps,
                              })}
                            >
                              <div
                                className="h-full rounded-full bg-dashboard-accent"
                                style={{ width: `${stepPercent}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="mt-auto pt-4">
                    <Link href={navHrefs.reports} className="dashboard-card-cta">
                      {t("welcomeQualityChecker.cards.reports.cta")} →
                    </Link>
                  </div>
                </DashboardCard>

                {/* Mes collègues */}
                <DashboardCard
                  titleId="card-colleagues"
                  title={t("welcomeQualityChecker.cards.colleagues.title")}
                  subtitle={t("welcomeQualityChecker.cards.colleagues.subtitle", { n: colleaguesFixture.length })}
                >
                  {colleaguesFixture.length === 0 ? (
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeQualityChecker.cards.colleagues.empty")}
                    </p>
                  ) : (
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {colleaguesFixture.slice(0, 4).map((c) => {
                        const statusDotClass =
                          c.status === "online"
                            ? "bg-dashboard-accent"
                            : c.status === "away"
                              ? "bg-dashboard-text-subtle"
                              : "bg-dashboard-divider";
                        return (
                          <li
                            key={c.id}
                            className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
                          >
                            <span
                              aria-hidden
                              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-dashboard-accent-soft text-xs font-semibold text-dashboard-accent"
                            >
                              {c.initials}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-dashboard-text">
                                {c.name}
                              </p>
                              <p className="truncate text-xs text-dashboard-text-muted">
                                {colleagueRoleLabel(c.role)}
                              </p>
                            </div>
                            <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-dashboard-text-subtle">
                              <span
                                aria-hidden
                                className={`inline-block size-1.5 rounded-full ${statusDotClass}`}
                              />
                              {colleagueStatusLabel(c.status)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="mt-auto pt-4">
                    <Link href={navHrefs.colleagues} className="dashboard-card-cta">
                      {t("welcomeQualityChecker.cards.colleagues.cta")} →
                    </Link>
                  </div>
                </DashboardCard>

                {/* Mes derniers messages */}
                <DashboardCard
                  titleId="card-messages"
                  title={t("welcomeQualityChecker.cards.messages.title")}
                >
                  {messagesFixture.length === 0 ? (
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeQualityChecker.cards.messages.empty")}
                    </p>
                  ) : (
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {messagesFixture.slice(0, 3).map((m) => (
                        <li key={m.id} className="py-2 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-dashboard-text">
                              {m.unread && (
                                <span
                                  aria-label={t("welcomeQualityChecker.cards.messages.unread")}
                                  className="inline-block size-1.5 shrink-0 rounded-full bg-dashboard-accent"
                                />
                              )}
                              <span className="truncate">{m.sender}</span>
                            </p>
                            <span className="shrink-0 text-xs text-dashboard-text-subtle">
                              {formatRelativeAgo(m.agoMinutes)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-dashboard-text-muted">
                            {m.preview}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto pt-4">
                    <Link href={`${prefix}/messages`} className="dashboard-card-cta">
                      {t("welcomeQualityChecker.cards.messages.cta")} →
                    </Link>
                  </div>
                </DashboardCard>

                {/* Actualité pédagogique */}
                <DashboardCard
                  titleId="card-news"
                  title={t("welcomeQualityChecker.cards.news.title")}
                >
                  <ul role="list" className="flex flex-col gap-3">
                    {newsFixture.slice(0, 3).map((n) => (
                      <li key={n.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex rounded bg-dashboard-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dashboard-accent">
                            {newsTagLabel(n.tag)}
                          </span>
                          <time
                            dateTime={n.publishedAt}
                            className="text-xs text-dashboard-text-subtle"
                          >
                            {newsDateFormatter.format(new Date(n.publishedAt))}
                          </time>
                        </div>
                        <p className="line-clamp-2 text-sm text-dashboard-text">
                          {n.title}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4">
                    <Link href={`${prefix}/news`} className="dashboard-card-cta">
                      {t("welcomeQualityChecker.cards.news.cta")} →
                    </Link>
                  </div>
                </DashboardCard>
                </div>
              </div>

              {/* ─── Side column: chat above agenda, single column on xl ─── */}
              <div className="flex flex-col gap-4 sm:gap-5">
                <DashboardCard
                  titleId="card-chat"
                  title={t("welcomeQualityChecker.cards.chat.title")}
                  subtitle={t("welcomeQualityChecker.cards.chat.subtitle", { n: chatRoomsFixture.length })}
                >
                  <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                    {chatRoomsFixture.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-dashboard-text">
                            {r.name}
                          </p>
                          <p className="truncate text-xs text-dashboard-text-muted">
                            {r.lastMessage}
                          </p>
                        </div>
                        {r.unread > 0 ? (
                          <span
                            aria-label={t("welcomeQualityChecker.cards.chat.unreadAria", { n: r.unread })}
                            className="shrink-0 rounded-full bg-dashboard-accent px-2 py-0.5 text-[10px] font-bold text-dashboard-accent-on"
                          >
                            {r.unread}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-dashboard-text-subtle">
                            {t("welcomeQualityChecker.cards.chat.members", { n: r.members })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4">
                    <Link href={`${prefix}/chat`} className="dashboard-card-cta">
                      {t("welcomeQualityChecker.cards.chat.cta")} →
                    </Link>
                  </div>
                </DashboardCard>

                <DashboardCard
                  titleId="card-agenda"
                  title={t("welcomeQualityChecker.cards.agenda.title")}
                  subtitle={t("welcomeQualityChecker.cards.agenda.subtitle")}
                >
                  {agendaFixture.length === 0 ? (
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeQualityChecker.cards.agenda.empty")}
                    </p>
                  ) : (
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {agendaFixture.slice(0, 3).map((a) => {
                        const start = new Date(a.date);
                        const locationLabel =
                          a.location === "remote"
                            ? t("welcomeQualityChecker.cards.agenda.locationRemote")
                            : t("welcomeQualityChecker.cards.agenda.locationOnsite");
                        return (
                          <li
                            key={a.id}
                            className="flex items-start gap-3 py-2 first:pt-0 last:pb-0"
                          >
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
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-medium text-dashboard-text">
                                {a.title}
                              </p>
                              <p className="mt-0.5 text-xs text-dashboard-text-muted">
                                {dateTimeFormatter.format(start)} · {a.durationMin} min · {locationLabel}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="mt-auto pt-4">
                    <Link href={`${prefix}/agenda`} className="dashboard-card-cta">
                      {t("welcomeQualityChecker.cards.agenda.cta")} →
                    </Link>
                  </div>
                </DashboardCard>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
