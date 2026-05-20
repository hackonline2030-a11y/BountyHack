import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/** Workflow role inside a report team (distinct from global app role). */
export type ReportTeamMemberRole =
  | "hunter"
  | "quality_checker"
  | "mentor"
  | "super_admin";

export type ReportTeamValidity = "valid" | "incomplete";

export type MembershipRequestStatus = "pending" | "approved" | "rejected";

export type ReportTeamMember = {
  userId: string;
  displayName: string;
  role: ReportTeamMemberRole;
};

export type ReportTeam = {
  id: string;
  reportDraftId: string;
  label: string;
  validity: ReportTeamValidity;
  draftAggregateStatus: ReportDraftDomainModel.AggregateStatus;
  /** Report draft owner (primary hunter) — cannot be removed from the team. */
  reportDraftOwnerUserId: string;
  /** User id of the hunter who may edit/submit steps (`hunter_writer_id` on the draft). */
  hunterWriterUserId: string;
  members: ReportTeamMember[];
  updatedAt: string;
};

export type ReportTeamJoinRequest = {
  id: string;
  teamId?: string;
  reportDraftId?: string;
  teamLabel: string;
  userId?: string;
  requesterDisplayName?: string;
  requestedRole: ReportTeamMemberRole;
  message?: string;
  status: MembershipRequestStatus;
  requestedAt: string;
};
