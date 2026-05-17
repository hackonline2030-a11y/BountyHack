import type {
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";

export const reportTeamsFixture: ReadonlyArray<ReportTeam> = [
  {
    id: "rt-7f3a2c91-e4b8-4d12-9c0f-a1b2c3d4e5f6",
    reportDraftId: "draft-1042",
    label: "Rapport #1042 — XSS module commentaires",
    validity: "valid",
    draftAggregateStatus: "under-review",
    updatedAt: "2026-05-14T16:30:00.000Z",
    members: [
      { userId: "u-h1", displayName: "Maya R.", role: "hunter" },
      { userId: "u-qc1", displayName: "Eva Janssen", role: "quality_checker" },
      { userId: "u-m1", displayName: "Lina Bensaid", role: "mentor" },
    ],
  },
  {
    id: "rt-2b8e1d40-6a7c-4f9e-b2d1-8e4f5a6b7c8d",
    reportDraftId: "draft-1039",
    label: "Rapport #1039 — SSRF webhook",
    validity: "valid",
    draftAggregateStatus: "draft",
    updatedAt: "2026-05-12T09:15:00.000Z",
    members: [
      { userId: "u-h2", displayName: "Léa P.", role: "hunter" },
      { userId: "u-qc2", displayName: "Pierre Costa", role: "quality_checker" },
    ],
  },
];

export const myJoinRequestsFixture: ReadonlyArray<ReportTeamJoinRequest> = [
  {
    id: "req-001",
    teamId: "rt-2b8e1d40-6a7c-4f9e-b2d1-8e4f5a6b7c8d",
    reportDraftId: "draft-1039",
    teamLabel: "Rapport #1039 — SSRF webhook",
    requestedRole: "mentor",
    status: "pending",
    requestedAt: "2026-05-15T08:00:00.000Z",
  },
];

export const coordinatorPendingRequestsFixture: ReadonlyArray<ReportTeamJoinRequest> = [
  {
    id: "req-001",
    teamId: "rt-2b8e1d40-6a7c-4f9e-b2d1-8e4f5a6b7c8d",
    reportDraftId: "draft-1039",
    teamLabel: "Rapport #1039 — SSRF webhook",
    requestedRole: "mentor",
    status: "pending",
    requestedAt: "2026-05-15T08:00:00.000Z",
  },
  {
    id: "req-002",
    teamId: "rt-7f3a2c91-e4b8-4d12-9c0f-a1b2c3d4e5f6",
    reportDraftId: "draft-1042",
    teamLabel: "Rapport #1042 — XSS module commentaires",
    requestedRole: "hunter",
    status: "pending",
    requestedAt: "2026-05-15T10:22:00.000Z",
  },
];

/** Mirrors {@link REPORT_TEAM_VALIDITY_RULES} for fixtures — hunter + (mentor | QC). */
export { REPORT_TEAM_VALIDITY_RULES as roleSlotRequirements } from "@modules/report-team/core/validity/report-team-validity.rules";
