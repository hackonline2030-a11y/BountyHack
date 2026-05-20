import type { OrphanReportDraft } from "@modules/report-team/model/orphan-report-draft.types";
import type {
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamLeaveRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import type { IReportTeamRepository } from "@modules/report-team/core/repository/report-team.repository";
import { isEnrollmentJoinRequest } from "@modules/report-team/model/report-team-join-request.utils";

export class InMemoryReportTeamRepository implements IReportTeamRepository {
  private teams = new Map<string, ReportTeam>();
  private requests = new Map<string, ReportTeamJoinRequest>();
  private leaveRequests = new Map<string, ReportTeamLeaveRequest>();

  async findMyTeams(): Promise<ReportTeam[]> {
    return [...this.teams.values()];
  }

  async findJoinableTeams(): Promise<ReportTeam[]> {
    return [...this.teams.values()];
  }

  async findAllTeams(): Promise<ReportTeam[]> {
    return [...this.teams.values()];
  }

  async findOrphanDrafts(): Promise<OrphanReportDraft[]> {
    return [];
  }

  async findById(id: string): Promise<ReportTeam | null> {
    return this.teams.get(id) ?? null;
  }

  async findByReportDraftId(reportDraftId: string): Promise<ReportTeam | null> {
    return (
      [...this.teams.values()].find((t) => t.reportDraftId === reportDraftId) ?? null
    );
  }

  async createTeam(input: {
    label: string;
    members: Array<{ userId: string; role: ReportTeamMemberRole }>;
    reportDraftId?: string;
    hunterWriterUserId?: string;
  }): Promise<ReportTeam> {
    const primaryHunterId =
      input.members.find((m) => m.role === "hunter")?.userId ?? "";
    const team: ReportTeam = {
      id: `team-${this.teams.size + 1}`,
      reportDraftId: input.reportDraftId ?? `draft-${this.teams.size + 1}`,
      label: input.label,
      validity: "incomplete",
      draftAggregateStatus: "draft",
      reportDraftOwnerUserId: primaryHunterId,
      hunterWriterUserId:
        input.hunterWriterUserId ??
        input.members.find((m) => m.role === "hunter")?.userId ??
        "",
      members: [],
      updatedAt: new Date().toISOString(),
    };
    this.teams.set(team.id, team);
    return team;
  }

  async updateTeam(id: string, input: { label: string }): Promise<ReportTeam> {
    const team = this.teams.get(id);
    if (!team) throw new Error("not found");
    const updated = { ...team, label: input.label, updatedAt: new Date().toISOString() };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    this.teams.delete(id);
  }

  async removeTeamMember(teamId: string, memberUserId: string): Promise<ReportTeam> {
    const team = this.teams.get(teamId);
    if (!team) throw new Error("not found");
    if (memberUserId === team.reportDraftOwnerUserId) {
      throw new Error("Cannot remove the primary report hunter from the team");
    }
    const nextMembers = team.members.filter((m) => m.userId !== memberUserId);
    let hunterWriterUserId = team.hunterWriterUserId;
    if (hunterWriterUserId === memberUserId) {
      hunterWriterUserId = team.reportDraftOwnerUserId;
    }
    const updated: ReportTeam = {
      ...team,
      members: nextMembers,
      hunterWriterUserId,
      updatedAt: new Date().toISOString(),
    };
    this.teams.set(teamId, updated);
    return updated;
  }

  async leaveTeam(teamId: string): Promise<ReportTeam> {
    throw new Error("leaveTeam not implemented in in-memory repository");
  }

  async findCoordinatorHunterUsers(): Promise<
    Array<{ userId: string; displayName: string }>
  > {
    return [];
  }

  async findMyJoinRequests(): Promise<ReportTeamJoinRequest[]> {
    return [...this.requests.values()];
  }

  async findPendingJoinRequests(): Promise<ReportTeamJoinRequest[]> {
    return [...this.requests.values()].filter((r) => r.status === "pending");
  }

  async createJoinRequest(input: {
    reportDraftId: string;
    requestedRole: ReportTeamMemberRole;
    message?: string;
  }): Promise<ReportTeamJoinRequest> {
    const team = [...this.teams.values()].find(
      (t) => t.reportDraftId === input.reportDraftId,
    );
    if (!team) throw new Error("Report team not found");
    const req: ReportTeamJoinRequest = {
      id: `req-${this.requests.size + 1}`,
      teamId: team.id,
      reportDraftId: team.reportDraftId,
      teamLabel: team.label,
      requestedRole: input.requestedRole,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    this.requests.set(req.id, req);
    return req;
  }

  async createEnrollmentRequest(input: {
    requestedRole: ReportTeamMemberRole;
    message?: string;
  }): Promise<ReportTeamJoinRequest> {
    const pending = [...this.requests.values()].find(
      (r) => isEnrollmentJoinRequest(r) && r.status === "pending",
    );
    if (pending) throw new Error("A pending enrollment request already exists");
    const req: ReportTeamJoinRequest = {
      id: `req-${this.requests.size + 1}`,
      teamLabel: "General enrollment",
      requestedRole: input.requestedRole,
      message: input.message,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    this.requests.set(req.id, req);
    return req;
  }

  async approveJoinRequest(id: string): Promise<ReportTeamJoinRequest> {
    const req = this.requests.get(id);
    if (!req) throw new Error("not found");
    const updated = { ...req, status: "approved" as const };
    this.requests.set(id, updated);
    return updated;
  }

  async rejectJoinRequest(id: string): Promise<ReportTeamJoinRequest> {
    const req = this.requests.get(id);
    if (!req) throw new Error("not found");
    const updated = { ...req, status: "rejected" as const };
    this.requests.set(id, updated);
    return updated;
  }

  async findMyLeaveRequests(): Promise<ReportTeamLeaveRequest[]> {
    return [...this.leaveRequests.values()];
  }

  async findPendingLeaveRequests(): Promise<ReportTeamLeaveRequest[]> {
    return [...this.leaveRequests.values()].filter((r) => r.status === "pending");
  }

  async createLeaveRequest(input: {
    teamId: string;
    message?: string;
  }): Promise<ReportTeamLeaveRequest> {
    const team = this.teams.get(input.teamId);
    if (!team) throw new Error("Report team not found");
    const req: ReportTeamLeaveRequest = {
      id: `leave-${this.leaveRequests.size + 1}`,
      teamId: team.id,
      reportDraftId: team.reportDraftId,
      teamLabel: team.label,
      userId: team.reportDraftOwnerUserId,
      requesterDisplayName: "Primary hunter",
      message: input.message,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    this.leaveRequests.set(req.id, req);
    return req;
  }

  async approveLeaveRequest(id: string): Promise<ReportTeamLeaveRequest> {
    const req = this.leaveRequests.get(id);
    if (!req) throw new Error("not found");
    const updated = { ...req, status: "approved" as const };
    this.leaveRequests.set(id, updated);
    return updated;
  }

  async rejectLeaveRequest(id: string): Promise<ReportTeamLeaveRequest> {
    const req = this.leaveRequests.get(id);
    if (!req) throw new Error("not found");
    const updated = { ...req, status: "rejected" as const };
    this.leaveRequests.set(id, updated);
    return updated;
  }
}
