import type {
  ReportDraft,
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamMember,
  User,
} from '../../../generated/prisma/client';
import { ReportDraftPrismaMapper } from '../../../report-draft/adapters/postgre-prisma/report-draft-prisma.mapper';
import { computeTeamValidity } from '../../application/report-team-validity';
import type {
  ReportTeamJoinRequestWire,
  ReportTeamMemberWire,
  ReportTeamWire,
} from '../../models/report-team-api.types';
import { ReportTeamEnumMapper } from './report-team-enum.mapper';

type TeamWithMembers = ReportTeam & {
  members: (ReportTeamMember & { user: User })[];
  reportDraft: Pick<ReportDraft, 'aggregateStatus'>;
};

type JoinRequestWithRelations = ReportTeamJoinRequest & {
  team: ReportTeam | null;
  user: User;
};

export class ReportTeamPrismaMapper {
  static displayNameForUser(user: Pick<User, 'id' | 'username' | 'email'>): string {
    return user.username?.trim() || user.email?.trim() || user.id;
  }

  static memberToWire(row: ReportTeamMember & { user: User }): ReportTeamMemberWire {
    return {
      userId: row.userId,
      displayName: this.displayNameForUser(row.user),
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
      draftAggregateStatus: ReportDraftPrismaMapper.aggregateStatusToWire(
        row.reportDraft.aggregateStatus,
      ),
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
      requesterDisplayName: this.displayNameForUser(row.user),
      requestedRole: ReportTeamEnumMapper.memberRoleToWire(row.requestedRole),
      message: row.message ?? undefined,
      status: ReportTeamEnumMapper.requestStatusToWire(row.status),
      requestedAt: row.requestedAt.toISOString(),
    };
  }
}
