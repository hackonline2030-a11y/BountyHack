import { fetchBff } from "@/lib/bff-fetch";
import { readFriendlyHttpError } from "@/lib/http-error-message";
import type { OrphanReportDraft } from "@modules/report-team/model/orphan-report-draft.types";
import type {
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import type { IReportTeamRepository } from "@modules/report-team/core/repository/report-team.repository";
import { parseJsonResponse } from "@modules/report-team/core/repository-infra/http-json";

const teamsBase = "/api/report-draft/report-teams";
const joinBase = "/api/report-draft/report-teams/join-requests";

export class HttpReportTeamRepository implements IReportTeamRepository {
  async findMyTeams(): Promise<ReportTeam[]> {
    const res = await fetchBff(`${teamsBase}/mine`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async findJoinableTeams(): Promise<ReportTeam[]> {
    const res = await fetchBff(`${teamsBase}/joinable`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async findAllTeams(): Promise<ReportTeam[]> {
    const res = await fetchBff(teamsBase, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async findOrphanDrafts(): Promise<OrphanReportDraft[]> {
    const res = await fetchBff("/api/report-draft/coordination/orphan-drafts", {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async findById(id: string): Promise<ReportTeam | null> {
    const res = await fetchBff(`${teamsBase}/${encodeURIComponent(id)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 404) return null;
    return parseJsonResponse(res);
  }

  async findByReportDraftId(reportDraftId: string): Promise<ReportTeam | null> {
    const res = await fetchBff(
      `${teamsBase}/by-draft/${encodeURIComponent(reportDraftId)}`,
      {
        credentials: "include",
        cache: "no-store",
      },
    );
    if (res.status === 404) return null;
    return parseJsonResponse(res);
  }

  async createTeam(input: {
    label: string;
    members: Array<{ userId: string; role: ReportTeamMemberRole }>;
    reportDraftId?: string;
    hunterWriterUserId?: string;
  }): Promise<ReportTeam> {
    const res = await fetchBff(teamsBase, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async updateTeam(id: string, input: { label: string }): Promise<ReportTeam> {
    const res = await fetchBff(`${teamsBase}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async deleteTeam(id: string): Promise<void> {
    const res = await fetchBff(`${teamsBase}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(await readFriendlyHttpError(res, "Impossible de supprimer l’équipe."));
    }
  }

  async removeTeamMember(teamId: string, memberUserId: string): Promise<ReportTeam> {
    const res = await fetchBff(
      `${teamsBase}/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberUserId)}`,
      { method: "DELETE", credentials: "include", cache: "no-store" },
    );
    return parseJsonResponse(res);
  }

  async leaveTeam(teamId: string): Promise<ReportTeam> {
    const res = await fetchBff(`${teamsBase}/${encodeURIComponent(teamId)}/members/me`, {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async findMyJoinRequests(): Promise<ReportTeamJoinRequest[]> {
    const res = await fetchBff(`${joinBase}/mine`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async findPendingJoinRequests(): Promise<ReportTeamJoinRequest[]> {
    const res = await fetchBff(`${joinBase}/pending`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async createJoinRequest(input: {
    reportDraftId: string;
    requestedRole: ReportTeamMemberRole;
    message?: string;
  }): Promise<ReportTeamJoinRequest> {
    const res = await fetchBff(joinBase, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async createEnrollmentRequest(input: {
    requestedRole: ReportTeamMemberRole;
    message?: string;
  }): Promise<ReportTeamJoinRequest> {
    const res = await fetchBff(`${joinBase}/enroll`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseJsonResponse(res);
  }

  async approveJoinRequest(id: string): Promise<ReportTeamJoinRequest> {
    const res = await fetchBff(
      `${joinBase}/${encodeURIComponent(id)}/approve`,
      { method: "POST", credentials: "include" },
    );
    return parseJsonResponse(res);
  }

  async rejectJoinRequest(id: string): Promise<ReportTeamJoinRequest> {
    const res = await fetchBff(
      `${joinBase}/${encodeURIComponent(id)}/reject`,
      { method: "POST", credentials: "include" },
    );
    return parseJsonResponse(res);
  }
}
