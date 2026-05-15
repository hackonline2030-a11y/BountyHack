/** Mock data for the mentor welcome dashboard (front-end only). */

export type CaseToSupportFixture = {
  id: string;
  reference: string;
  title: string;
  hunter: string;
  step: number;
  totalSteps: number;
  submittedAgoMinutes: number;
};

export const casesToSupportFixture: ReadonlyArray<CaseToSupportFixture> = [
  {
    id: "rep-1042",
    reference: "#1042",
    title: "Stored XSS — module commentaires",
    hunter: "Maya R.",
    step: 2,
    totalSteps: 8,
    submittedAgoMinutes: 120,
  },
  {
    id: "rep-1039",
    reference: "#1039",
    title: "SSRF via webhook configurable",
    hunter: "Léa P.",
    step: 1,
    totalSteps: 8,
    submittedAgoMinutes: 60 * 6,
  },
];

export type NewsTag = "announcement" | "info" | "update";

export type NewsFixture = {
  id: string;
  tag: NewsTag;
  title: string;
  publishedAt: string;
};

export const newsFixture: ReadonlyArray<NewsFixture> = [
  {
    id: "n1",
    tag: "announcement",
    title: "Atelier « Triager comme un mentor » — 22/05",
    publishedAt: "2026-05-12",
  },
  {
    id: "n2",
    tag: "update",
    title: "Fiche méthodo : chaîne SSRF → impact métier",
    publishedAt: "2026-05-08",
  },
];

export type MessageFixture = {
  id: string;
  sender: string;
  preview: string;
  agoMinutes: number;
  unread: boolean;
};

export const messagesFixture: ReadonlyArray<MessageFixture> = [
  {
    id: "m1",
    sender: "Coordinateur",
    preview: "Demande d’affectation équipe #1039 en attente.",
    agoMinutes: 45,
    unread: true,
  },
  {
    id: "m2",
    sender: "Maya R. (Hunter)",
    preview: "Question sur la preuve d’impact XSS.",
    agoMinutes: 60 * 2,
    unread: false,
  },
];

export type AgendaItemFixture = {
  id: string;
  title: string;
  date: string;
  durationMin: number;
  location: "remote" | "onsite";
};

export const agendaFixture: ReadonlyArray<AgendaItemFixture> = [
  {
    id: "a1",
    title: "Coaching — relecture META #1042",
    date: "2026-05-16T14:00:00Z",
    durationMin: 45,
    location: "remote",
  },
];
