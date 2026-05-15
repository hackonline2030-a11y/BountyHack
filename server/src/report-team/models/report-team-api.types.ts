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
  members: ReportTeamMemberAssignmentWire[];
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
