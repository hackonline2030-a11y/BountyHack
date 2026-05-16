import type {
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import type { IReportTeamRepository } from "@modules/report-team/core/repository/report-team.repository";

export class InMemoryReportTeamRepository implements IReportTeamRepository {
  private teams = new Map<string, ReportTeam>();
  private requests = new Map<string, ReportTeamJoinRequest>();

  async findMyTeams(): Promise<ReportTeam[]> {
    return [...this.teams.values()];
  }

  async findJoinableTeams(): Promise<ReportTeam[]> {
    return [...this.teams.values()];
  }

  async findAllTeams(): Promise<ReportTeam[]> {
    return [...this.teams.values()];
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
  }): Promise<ReportTeam> {
    const team: ReportTeam = {
      id: `team-${this.teams.size + 1}`,
      reportDraftId: `draft-${this.teams.size + 1}`,
      label: input.label,
      validity: "incomplete",
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
      (r) => !r.teamId && r.status === "pending",
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
}
