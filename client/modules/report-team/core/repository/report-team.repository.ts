import type { OrphanReportDraft } from "@modules/report-team/model/orphan-report-draft.types";
import type {
  ReportTeam,
  ReportTeamJoinRequest,
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
  }): Promise<ReportTeam>;
  updateTeam(id: string, input: { label: string }): Promise<ReportTeam>;
  deleteTeam(id: string): Promise<void>;
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
}
