import type {
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamMember,
  User,
} from '../../../generated/prisma/client';
import { computeTeamValidity } from '../../application/report-team-validity';
import type {
  ReportTeamJoinRequestWire,
  ReportTeamMemberWire,
  ReportTeamWire,
} from '../../models/report-team-api.types';
import { ReportTeamEnumMapper } from './report-team-enum.mapper';

type TeamWithMembers = ReportTeam & {
  members: (ReportTeamMember & { user: User })[];
};

type JoinRequestWithRelations = ReportTeamJoinRequest & {
  team: ReportTeam | null;
  user: User;
};

function displayName(user: User): string {
  return user.username?.trim() || user.email?.trim() || user.id;
}

export class ReportTeamPrismaMapper {
  static memberToWire(row: ReportTeamMember & { user: User }): ReportTeamMemberWire {
    return {
      userId: row.userId,
      displayName: displayName(row.user),
      role: ReportTeamEnumMapper.memberRoleToWire(row.role),
    };
  }

  static teamToWire(row: TeamWithMembers): ReportTeamWire {
    const members = row.members.map((m) => this.memberToWire(m));
    return {
      id: row.id,
      reportDraftId: row.reportDraftId,
      label: row.label,
      validity: computeTeamValidity(members.map((m) => m.role)),
      members,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  static joinRequestToWire(row: JoinRequestWithRelations): ReportTeamJoinRequestWire {
    return {
      id: row.id,
      teamId: row.teamId ?? undefined,
      reportDraftId: row.team?.reportDraftId,
      teamLabel: row.team?.label ?? '',
      userId: row.userId,
      requesterDisplayName: displayName(row.user),
      requestedRole: ReportTeamEnumMapper.memberRoleToWire(row.requestedRole),
      message: row.message ?? undefined,
      status: ReportTeamEnumMapper.requestStatusToWire(row.status),
      requestedAt: row.requestedAt.toISOString(),
    };
  }
}
