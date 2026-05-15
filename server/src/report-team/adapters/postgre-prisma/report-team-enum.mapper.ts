import {
  ReportTeamJoinRequestStatus,
  ReportTeamMemberRole,
} from '../../../generated/prisma/enums';
import type {
  MembershipRequestStatusWire,
  ReportTeamMemberRoleWire,
} from '../../models/report-team-api.types';

const ROLE_TO_WIRE: Record<ReportTeamMemberRole, ReportTeamMemberRoleWire> = {
  [ReportTeamMemberRole.HUNTER]: 'hunter',
  [ReportTeamMemberRole.QUALITY_CHECKER]: 'quality_checker',
  [ReportTeamMemberRole.MENTOR]: 'mentor',
};

const ROLE_FROM_WIRE: Record<ReportTeamMemberRoleWire, ReportTeamMemberRole> = {
  hunter: ReportTeamMemberRole.HUNTER,
  quality_checker: ReportTeamMemberRole.QUALITY_CHECKER,
  mentor: ReportTeamMemberRole.MENTOR,
};

const STATUS_TO_WIRE: Record<
  ReportTeamJoinRequestStatus,
  MembershipRequestStatusWire
> = {
  [ReportTeamJoinRequestStatus.PENDING]: 'pending',
  [ReportTeamJoinRequestStatus.APPROVED]: 'approved',
  [ReportTeamJoinRequestStatus.REJECTED]: 'rejected',
};

const STATUS_FROM_WIRE: Record<
  MembershipRequestStatusWire,
  ReportTeamJoinRequestStatus
> = {
  pending: ReportTeamJoinRequestStatus.PENDING,
  approved: ReportTeamJoinRequestStatus.APPROVED,
  rejected: ReportTeamJoinRequestStatus.REJECTED,
};

export class ReportTeamEnumMapper {
  static memberRoleToWire(role: ReportTeamMemberRole): ReportTeamMemberRoleWire {
    return ROLE_TO_WIRE[role];
  }

  static memberRoleFromWire(role: ReportTeamMemberRoleWire): ReportTeamMemberRole {
    return ROLE_FROM_WIRE[role];
  }

  static requestStatusToWire(
    status: ReportTeamJoinRequestStatus,
  ): MembershipRequestStatusWire {
    return STATUS_TO_WIRE[status];
  }

  static requestStatusFromWire(
    status: MembershipRequestStatusWire,
  ): ReportTeamJoinRequestStatus {
    return STATUS_FROM_WIRE[status];
  }
}
