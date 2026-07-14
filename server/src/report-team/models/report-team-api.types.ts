import type { AggregateStatusWire } from '../../report-shared/models/report-aggregate-status.wire';

export type ReportTeamMemberRoleWire =
  | 'hunter'
  | 'quality_checker'
  | 'mentor';

export type ReportTeamValidityWire = 'valid' | 'incomplete';

export type MembershipRequestStatusWire = 'pending' | 'approved' | 'rejected';

export interface ReportTeamMemberWire {
  userId: string;
  displayName: string;
  role: ReportTeamMemberRoleWire;
}

export interface ReportTeamWire {
  id: string;
  reportDraftId: string;
  label: string;
  validity: ReportTeamValidityWire;
  /** Linked report draft workflow status (1 team ↔ 1 draft). */
  draftAggregateStatus: AggregateStatusWire;
  /** Report draft owner primary hunter (`report_drafts.hunter_id`); cannot be removed from the team. */
  reportDraftOwnerUserId: string;
  /** User id allowed to edit/submit steps (`report_drafts.hunter_writer_id`). */
  hunterWriterUserId: string;
  members: ReportTeamMemberWire[];
  updatedAt: string;
}

export interface ReportTeamJoinRequestWire {
  id: string;
  teamId?: string;
  reportDraftId?: string;
  teamLabel: string;
  userId: string;
  requesterDisplayName: string;
  requestedRole: ReportTeamMemberRoleWire;
  message?: string;
  status: MembershipRequestStatusWire;
  requestedAt: string;
}

export interface ReportTeamMemberAssignmentWire {
  userId: string;
  role: ReportTeamMemberRoleWire;
}

export interface CreateReportTeamInput {
  label: string;
  /** Combined roles must include at most one `quality_checker`. */
  members: ReportTeamMemberAssignmentWire[];
  /**
   * When set, attach the team to this existing draft (must have no team).
   * The draft owner is always the team hunter; `members` are additional roles
   * from approved join/enrollment requests (mentor, QC, etc.).
   */
  reportDraftId?: string;
  /**
   * Which squad hunter may edit the new draft and submit steps (`hunter_writer_id`).
   * Optional when exactly one hunter is on the team (that hunter is used).
   * Required when multiple hunters are included — must match one of their user ids.
   */
  hunterWriterUserId?: string;
}

export interface UpdateReportTeamInput {
  label: string;
}

export interface CreateJoinRequestInput {
  reportDraftId: string;
  requestedRole: ReportTeamMemberRoleWire;
  message?: string;
}

export interface CreateEnrollmentRequestInput {
  requestedRole: ReportTeamMemberRoleWire;
  message?: string;
}

export interface ReportTeamLeaveRequestWire {
  id: string;
  teamId: string;
  reportDraftId: string;
  teamLabel: string;
  userId: string;
  requesterDisplayName: string;
  message?: string;
  status: MembershipRequestStatusWire;
  requestedAt: string;
}

export interface CreateLeaveRequestInput {
  teamId: string;
  message?: string;
}
