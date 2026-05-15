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
  label: string;
  validity: ReportTeamValidity;
  members: ReportTeamMember[];
  updatedAt: string;
};

export type ReportTeamJoinRequest = {
  id: string;
  teamId: string;
  teamLabel: string;
  requestedRole: ReportTeamMemberRole;
  status: MembershipRequestStatus;
  requestedAt: string;
};
