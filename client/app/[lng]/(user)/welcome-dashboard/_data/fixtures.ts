/**
 * Mock data for the welcome dashboard. These are raw fixtures, kept in a
 * single module so they can be swapped with a real DAL later without
 * touching the page or the card components.
 *
 * All strings are in French (matching the project's default copy); they are
 * placeholders for fixture data, not user-facing translated content — those
 * live in `welcomeDashboard.json`.
 */

export type CurrentTrackFixture = {
  title: string;
  level: string;
  progressPercent: number;
  modulesTotal: number;
  modulesCompleted: number;
  nextModule: string;
};

export const currentTrackFixture: CurrentTrackFixture = {
  title: "Web Application Hunter",
  level: "Intermédiaire",
  progressPercent: 62,
  modulesTotal: 18,
  modulesCompleted: 11,
  nextModule: "SSRF — Server-Side Request Forgery",
};

export type BadgeFixture = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earnedAt: string;
};

export const badgesFixture: ReadonlyArray<BadgeFixture> = [
  { id: "b-first-report", name: "Premier rapport", description: "Premier rapport soumis", emoji: "🥇", earnedAt: "2026-03-12" },
  { id: "b-xss-master", name: "XSS Master", description: "10 XSS validés", emoji: "💉", earnedAt: "2026-04-02" },
  { id: "b-team-player", name: "Esprit d'équipe", description: "5 collaborations en équipe", emoji: "🤝", earnedAt: "2026-04-19" },
  { id: "b-streak-7", name: "Série de 7 jours", description: "7 jours consécutifs d'activité", emoji: "🔥", earnedAt: "2026-05-01" },
];

export type MessageFixture = {
  id: string;
  sender: string;
  preview: string;
  agoMinutes: number;
  unread: boolean;
};

export const messagesFixture: ReadonlyArray<MessageFixture> = [
  { id: "m1", sender: "Lina (Mentor)", preview: "Bravo pour ton rapport sur le RCE — quelques retours…", agoMinutes: 12, unread: true },
  { id: "m2", sender: "Équipe Phoenix", preview: "On lance la chasse sur le programme « dojo-50 » demain.", agoMinutes: 95, unread: true },
  { id: "m3", sender: "Support", preview: "Ton compte est éligible au nouveau plan Pro.", agoMinutes: 60 * 24 * 2, unread: false },
];

export type NewsTag = "announcement" | "info" | "update";

export type NewsFixture = {
  id: string;
  tag: NewsTag;
  title: string;
  publishedAt: string;
};

export const newsFixture: ReadonlyArray<NewsFixture> = [
  { id: "n1", tag: "announcement", title: "Nouveau parcours « Cloud Misconfigurations » disponible", publishedAt: "2026-05-10" },
  { id: "n2", tag: "update", title: "Mise à jour du module CVSS 4.0", publishedAt: "2026-05-05" },
  { id: "n3", tag: "info", title: "Maintenance planifiée le 18/05 entre 02h et 04h", publishedAt: "2026-04-30" },
];

export type ChatRoomFixture = {
  id: string;
  name: string;
  members: number;
  lastMessage: string;
  unread: number;
};

export const chatRoomsFixture: ReadonlyArray<ChatRoomFixture> = [
  { id: "r1", name: "#general", members: 142, lastMessage: "Quelqu'un a un retour sur Burp 2026 ?", unread: 3 },
  { id: "r2", name: "#programme-dojo-50", members: 38, lastMessage: "Endpoint /api/v2/files leak…", unread: 1 },
  { id: "r3", name: "#parcours-web", members: 87, lastMessage: "Le module SSRF est 🔥", unread: 0 },
];

export type AgendaLocation = "remote" | "onsite";

export type AgendaItemFixture = {
  id: string;
  title: string;
  date: string;
  durationMin: number;
  location: AgendaLocation;
};

export const agendaFixture: ReadonlyArray<AgendaItemFixture> = [
  { id: "a1", title: "Live coaching — CVSS appliqué", date: "2026-05-14T18:30:00Z", durationMin: 60, location: "remote" },
  { id: "a2", title: "Bug bash — programme Aurora", date: "2026-05-17T13:00:00Z", durationMin: 240, location: "remote" },
  { id: "a3", title: "Atelier rapport — feedback 1:1", date: "2026-05-20T10:00:00Z", durationMin: 30, location: "onsite" },
];
