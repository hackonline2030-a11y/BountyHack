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
  badgesFixture,
  chatRoomsFixture,
  currentTrackFixture,
  messagesFixture,
  newsFixture,
  type NewsTag,
} from "./_data/fixtures";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("welcomeHunter", { lng });
  return { title: t("welcomeHunter.metaTitle") };
}

export default async function WelcomeHunterPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.HUNTER]);

  const { displayName } = await getWelcomeUser(lng);
  const { t } = await getT("welcomeHunter", { lng });

  const heading =
    displayName !== null
      ? t("welcomeHunter.headingWithUsername", { username: displayName })
      : t("welcomeHunter.heading");

  const prefix = `/${lng}`;

  const navLabels: DashboardNavLabels = {
    label: t("welcomeHunter.nav.label"),
    emails: t("welcomeHunter.nav.emails"),
    reports: t("welcomeHunter.nav.reports"),
    tracks: t("welcomeHunter.nav.tracks"),
    courses: t("welcomeHunter.nav.courses"),
    teams: t("welcomeHunter.nav.teams"),
    mentors: t("welcomeHunter.nav.mentors"),
    support: t("welcomeHunter.nav.support"),
    settings: t("welcomeHunter.nav.settings"),
  };

  /**
   * Placeholder hrefs — only `/parameters` exists today. Others are wired to
   * sensible mock paths so the markup is link-correct; replace as features
   * land.
   */
  const navHrefs: DashboardNavHrefs = {
    emails: `${prefix}/emails`,
    reports: `${prefix}/my-reports`,
    tracks: `${prefix}/tracks`,
    courses: `${prefix}/courses`,
    teams: `${prefix}/hunter-teams`,
    mentors: `${prefix}/mentors`,
    support: `${prefix}/support`,
    settings: `${prefix}/parameters`,
  };

  const track = currentTrackFixture;
  const trackPercent = Math.max(0, Math.min(100, Math.round(track.progressPercent)));
  const modulesLeft = Math.max(0, track.modulesTotal - track.modulesCompleted);

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
    if (minutes < 60) return t("welcomeHunter.cards.messages.ago", { value: `${minutes} min` });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("welcomeHunter.cards.messages.ago", { value: `${hours} h` });
    const days = Math.floor(hours / 24);
    return t("welcomeHunter.cards.messages.ago", { value: `${days} j` });
  };

  const newsTagLabel = (tag: NewsTag): string => {
    if (tag === "announcement") return t("welcomeHunter.cards.news.tagAnnouncement");
    if (tag === "info") return t("welcomeHunter.cards.news.tagInfo");
    return t("welcomeHunter.cards.news.tagUpdate");
  };

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto w-full max-w-7xl">
          <header className="pb-6 sm:pb-8">
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-heading-on-pattern sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-1 text-sm text-dashboard-subheading-on-pattern sm:text-base">
              {t("welcomeHunter.subheading")}
            </p>
          </header>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <DashboardSidebar labels={navLabels} hrefs={navHrefs} />

            <div className="grid min-w-0 flex-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              {/* ─── Primary content: 2x2 grid of cards ─── */}
              <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                {/* Parcours suivi */}
                <DashboardCard
                  titleId="card-current-track"
                  title={t("welcomeHunter.cards.currentTrack.title")}
                  subtitle={track.title}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-subtle">
                    {track.level}
                  </p>
                  <div
                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-dashboard-accent-soft"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={trackPercent}
                    aria-label={t("welcomeHunter.cards.currentTrack.title")}
                  >
                    <div
                      className="h-full rounded-full bg-dashboard-accent"
                      style={{ width: `${trackPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="font-semibold text-dashboard-text">
                      {t("welcomeHunter.cards.currentTrack.progressLabel", { percent: trackPercent })}
                    </span>
                    <span className="text-dashboard-text-muted">
                      {t("welcomeHunter.cards.currentTrack.remainingLabel", { n: modulesLeft })}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-dashboard-text-subtle">
                    {t("welcomeHunter.cards.currentTrack.nextLabel")}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-dashboard-text-muted">
                    → {track.nextModule}
                  </p>
                  <div className="mt-auto pt-4">
                    <Link href={navHrefs.tracks} className="dashboard-card-cta">
                      {t("welcomeHunter.cards.currentTrack.cta")} →
                    </Link>
                  </div>
                </DashboardCard>

                {/* Mes badges */}
                <DashboardCard
                  titleId="card-badges"
                  title={t("welcomeHunter.cards.badges.title")}
                  subtitle={t("welcomeHunter.cards.badges.subtitle", { n: badgesFixture.length })}
                >
                  {badgesFixture.length === 0 ? (
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeHunter.cards.badges.empty")}
                    </p>
                  ) : (
                    <ul role="list" className="flex flex-wrap gap-2">
                      {badgesFixture.map((badge) => (
                        <li
                          key={badge.id}
                          title={badge.description}
                          className="flex items-center gap-2 rounded-full border border-dashboard-card-border bg-dashboard-accent-soft px-3 py-1.5"
                        >
                          <span aria-hidden className="text-base leading-none">{badge.emoji}</span>
                          <span className="text-xs font-medium text-dashboard-text">
                            {badge.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto pt-4">
                    <Link href={`${prefix}/badges`} className="dashboard-card-cta">
                      {t("welcomeHunter.cards.badges.cta")} →
                    </Link>
                  </div>
                </DashboardCard>

                {/* Mes derniers messages */}
                <DashboardCard
                  titleId="card-messages"
                  title={t("welcomeHunter.cards.messages.title")}
                >
                  {messagesFixture.length === 0 ? (
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeHunter.cards.messages.empty")}
                    </p>
                  ) : (
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {messagesFixture.slice(0, 3).map((m) => (
                        <li key={m.id} className="py-2 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-dashboard-text">
                              {m.unread && (
                                <span
                                  aria-label={t("welcomeHunter.cards.messages.unread")}
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
                      {t("welcomeHunter.cards.messages.cta")} →
                    </Link>
                  </div>
                </DashboardCard>

                {/* Actualité pédagogique */}
                <DashboardCard
                  titleId="card-news"
                  title={t("welcomeHunter.cards.news.title")}
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
                      {t("welcomeHunter.cards.news.cta")} →
                    </Link>
                  </div>
                </DashboardCard>
              </div>

              {/* ─── Side column: chat above agenda, single column on xl ─── */}
              <div className="flex flex-col gap-4 sm:gap-5">
                <DashboardCard
                  titleId="card-chat"
                  title={t("welcomeHunter.cards.chat.title")}
                  subtitle={t("welcomeHunter.cards.chat.subtitle", { n: chatRoomsFixture.length })}
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
                            aria-label={t("welcomeHunter.cards.chat.unreadAria", { n: r.unread })}
                            className="shrink-0 rounded-full bg-dashboard-accent px-2 py-0.5 text-[10px] font-bold text-dashboard-accent-on"
                          >
                            {r.unread}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-dashboard-text-subtle">
                            {t("welcomeHunter.cards.chat.members", { n: r.members })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4">
                    <Link href={`${prefix}/chat`} className="dashboard-card-cta">
                      {t("welcomeHunter.cards.chat.cta")} →
                    </Link>
                  </div>
                </DashboardCard>

                <DashboardCard
                  titleId="card-agenda"
                  title={t("welcomeHunter.cards.agenda.title")}
                  subtitle={t("welcomeHunter.cards.agenda.subtitle")}
                >
                  {agendaFixture.length === 0 ? (
                    <p className="text-sm text-dashboard-text-muted">
                      {t("welcomeHunter.cards.agenda.empty")}
                    </p>
                  ) : (
                    <ul role="list" className="flex flex-col divide-y divide-dashboard-divider">
                      {agendaFixture.slice(0, 3).map((a) => {
                        const start = new Date(a.date);
                        const locationLabel =
                          a.location === "remote"
                            ? t("welcomeHunter.cards.agenda.locationRemote")
                            : t("welcomeHunter.cards.agenda.locationOnsite");
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
                      {t("welcomeHunter.cards.agenda.cta")} →
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
