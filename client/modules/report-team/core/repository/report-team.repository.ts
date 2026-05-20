import type { OrphanReportDraft } from "@modules/report-team/model/orphan-report-draft.types";
import type {
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamLeaveRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";

export interface IReportTeamRepository {
  findMyTeams(): Promise<ReportTeam[]>;
  findJoinableTeams(): Promise<ReportTeam[]>;
  findAllTeams(): Promise<ReportTeam[]>;
  findOrphanDrafts(): Promise<OrphanReportDraft[]>;
  findById(id: string): Promise<ReportTeam | null>;
  findByReportDraftId(reportDraftId: string): Promise<ReportTeam | null>;
  createTeam(input: {
    label: string;
    members: Array<{ userId: string; role: ReportTeamMemberRole }>;
    reportDraftId?: string;
    hunterWriterUserId?: string;
  }): Promise<ReportTeam>;
  updateTeam(id: string, input: { label: string }): Promise<ReportTeam>;
  deleteTeam(id: string): Promise<void>;
  removeTeamMember(teamId: string, memberUserId: string): Promise<ReportTeam>;
  leaveTeam(teamId: string): Promise<ReportTeam>;
  /** All users with global hunter role (coordinator primary-hunter picker). */
  findCoordinatorHunterUsers(): Promise<
    Array<{ userId: string; displayName: string }>
  >;
  findMyJoinRequests(): Promise<ReportTeamJoinRequest[]>;
  findPendingJoinRequests(): Promise<ReportTeamJoinRequest[]>;
  createJoinRequest(input: {
    reportDraftId: string;
    requestedRole: ReportTeamMemberRole;
    message?: string;
  }): Promise<ReportTeamJoinRequest>;
  createEnrollmentRequest(input: {
    requestedRole: ReportTeamMemberRole;
    message?: string;
  }): Promise<ReportTeamJoinRequest>;
  approveJoinRequest(id: string): Promise<ReportTeamJoinRequest>;
  rejectJoinRequest(id: string): Promise<ReportTeamJoinRequest>;
  findMyLeaveRequests(): Promise<ReportTeamLeaveRequest[]>;
  findPendingLeaveRequests(): Promise<ReportTeamLeaveRequest[]>;
  createLeaveRequest(input: { teamId: string; message?: string }): Promise<ReportTeamLeaveRequest>;
  approveLeaveRequest(id: string): Promise<ReportTeamLeaveRequest>;
  rejectLeaveRequest(id: string): Promise<ReportTeamLeaveRequest>;
}
