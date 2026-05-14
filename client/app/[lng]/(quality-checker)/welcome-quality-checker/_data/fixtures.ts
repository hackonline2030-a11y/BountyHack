/**
 * Mock data for the quality-checker welcome dashboard. These are raw
 * fixtures, kept in a single module so they can be swapped with a real
 * DAL later without touching the page or the card components.
 *
 * All strings are in French (matching the project's default copy); they
 * are placeholders for fixture data, not user-facing translated content
 * — those live in `welcomeQualityChecker.json`.
 */

export type ReportPriority = "high" | "medium" | "low";

export type ReportToCheckFixture = {
  id: string;
  reference: string;
  title: string;
  hunter: string;
  priority: ReportPriority;
  /** Current step of the review pipeline (1-based). */
  step: number;
  /** Total number of steps in the review pipeline. */
  totalSteps: number;
  submittedAgoMinutes: number;
};

export const reportsToCheckFixture: ReadonlyArray<ReportToCheckFixture> = [
  {
    id: "rep-1042",
    reference: "#1042",
    title: "Stored XSS dans le module commentaires",
    hunter: "Maya R.",
    priority: "high",
    step: 2,
    totalSteps: 5,
    submittedAgoMinutes: 35,
  },
  {
    id: "rep-1041",
    reference: "#1041",
    title: "IDOR — accès aux factures d'autres tenants",
    hunter: "Hugo D.",
    priority: "high",
    step: 1,
    totalSteps: 5,
    submittedAgoMinutes: 60 * 3,
  },
  {
    id: "rep-1039",
    reference: "#1039",
    title: "SSRF via webhook configurable",
    hunter: "Léa P.",
    priority: "medium",
    step: 3,
    totalSteps: 5,
    submittedAgoMinutes: 60 * 8,
  },
  {
    id: "rep-1037",
    reference: "#1037",
    title: "Open redirect sur /auth/callback",
    hunter: "Sam B.",
    priority: "low",
    step: 4,
    totalSteps: 5,
    submittedAgoMinutes: 60 * 24,
  },
];

export type ColleagueRole = "mentor" | "qualityChecker" | "lead";
export type ColleagueStatus = "online" | "away" | "offline";

export type ColleagueFixture = {
  id: string;
  name: string;
  role: ColleagueRole;
  status: ColleagueStatus;
  /** Two-letter avatar fallback, rendered when no picture is available. */
  initials: string;
};

export const colleaguesFixture: ReadonlyArray<ColleagueFixture> = [
  { id: "c1", name: "Lina Bensaid", role: "mentor", status: "online", initials: "LB" },
  { id: "c2", name: "Tariq Moreau", role: "lead", status: "online", initials: "TM" },
  { id: "c3", name: "Eva Janssen", role: "qualityChecker", status: "away", initials: "EJ" },
  { id: "c4", name: "Pierre Costa", role: "qualityChecker", status: "offline", initials: "PC" },
];

export type MessageFixture = {
  id: string;
  sender: string;
  preview: string;
  agoMinutes: number;
  unread: boolean;
};

export const messagesFixture: ReadonlyArray<MessageFixture> = [
  { id: "m1", sender: "Lina (Mentor)", preview: "Peux-tu revoir l'étape 2 du rapport #1042 ?", agoMinutes: 8, unread: true },
  { id: "m2", sender: "Tariq (Lead QC)", preview: "On aligne les critères CVSS demain en stand-up.", agoMinutes: 75, unread: true },
  { id: "m3", sender: "Hugo D. (Hunter)", preview: "Merci pour le feedback sur l'IDOR — j'ai poussé un patch.", agoMinutes: 60 * 5, unread: false },
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
  { id: "r1", name: "#qc-general", members: 24, lastMessage: "Reminder : revue hebdo demain 14h.", unread: 2 },
  { id: "r2", name: "#qc-triage", members: 12, lastMessage: "Le rapport #1042 est prioritaire.", unread: 1 },
  { id: "r3", name: "#qc-mentors", members: 9, lastMessage: "Notes de coaching mises à jour.", unread: 0 },
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
  { id: "a1", title: "Revue hebdo — backlog de rapports", date: "2026-05-15T13:00:00Z", durationMin: 60, location: "remote" },
  { id: "a2", title: "Calibration CVSS — atelier QC", date: "2026-05-17T09:00:00Z", durationMin: 90, location: "remote" },
  { id: "a3", title: "1:1 avec mentor — Lina", date: "2026-05-19T15:30:00Z", durationMin: 30, location: "onsite" },
];
