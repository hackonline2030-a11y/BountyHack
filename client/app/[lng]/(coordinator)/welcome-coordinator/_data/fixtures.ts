/** Mock data for the coordinator welcome dashboard (front-end only). */

import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import {
  coordinatorPendingRequestsFixture,
  reportTeamsFixture,
} from "@modules/report-team/fixtures/report-team.fixtures";

export type PendingRequestPreviewFixture = {
  id: string;
  requesterDisplayName: string;
  requestedRole: ReportTeamMemberRole;
  teamLabel: string;
  kind: "join" | "enrollment";
  requestedAgoMinutes: number;
};

const PENDING_REQUESTER_NAMES: Record<string, string> = {
  "req-001": "Alex D.",
  "req-002": "Sam K.",
};

export const pendingRequestsPreviewFixture: ReadonlyArray<PendingRequestPreviewFixture> =
  coordinatorPendingRequestsFixture.map((req) => ({
    id: req.id,
    requesterDisplayName: PENDING_REQUESTER_NAMES[req.id] ?? "Participant",
    requestedRole: req.requestedRole,
    teamLabel: req.teamLabel,
    kind: req.teamId ? "join" : "enrollment",
    requestedAgoMinutes:
      req.id === "req-001" ? 45 : req.id === "req-002" ? 120 : 60,
  }));

export type TeamOverviewFixture = {
  id: string;
  label: string;
  validity: "valid" | "incomplete";
  memberCount: number;
};

export const teamsOverviewFixture: ReadonlyArray<TeamOverviewFixture> =
  reportTeamsFixture.map((team) => ({
    id: team.id,
    label: team.label,
    validity: team.validity,
    memberCount: team.members.length,
  }));

export type WorkSessionFixture = {
  id: string;
  title: string;
  date: string;
  durationMin: number;
};

export const workSessionsFixture: ReadonlyArray<WorkSessionFixture> = [
  {
    id: "ws-1",
    title: "Point équipes — affectations #1039 / #1042",
    date: "2026-05-16T10:00:00.000Z",
    durationMin: 30,
  },
  {
    id: "ws-2",
    title: "Session collective — relecture brouillons",
    date: "2026-05-20T14:00:00.000Z",
    durationMin: 60,
  },
];

export type ParticipantPulseFixture = {
  id: string;
  displayName: string;
  note: string;
};

export const participantPulseFixture: ReadonlyArray<ParticipantPulseFixture> = [
  {
    id: "pp-1",
    displayName: "Jordan M.",
    note: "Enrollment pending — no team yet",
  },
  {
    id: "pp-2",
    displayName: "Inès V.",
    note: "Mentor request on #1039 — awaiting your decision",
  },
];

export type CoordinatorMessageFixture = {
  id: string;
  sender: string;
  preview: string;
  agoMinutes: number;
};

export const coordinatorMessagesFixture: ReadonlyArray<CoordinatorMessageFixture> = [
  {
    id: "cm-1",
    sender: "Lina Bensaid (Mentor)",
    preview: "Can we confirm the hunter slot on #1042 before Friday?",
    agoMinutes: 35,
  },
  {
    id: "cm-2",
    sender: "Léa P. (Hunter)",
    preview: "SSRF draft ready for team assignment.",
    agoMinutes: 60 * 3,
  },
];

export type ProgramNewsTag = "announcement" | "info" | "update";

export type ProgramNewsFixture = {
  id: string;
  tag: ProgramNewsTag;
  title: string;
};

export const programNewsFixture: ReadonlyArray<ProgramNewsFixture> = [
  {
    id: "pn-1",
    tag: "announcement",
    title: "New validity rule: hunter + mentor or quality checker",
  },
  {
    id: "pn-2",
    tag: "info",
    title: "Coordinator checklist — enrollment vs join requests",
  },
];
