import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import type { ReportTeamMemberRoleWire } from '../models/report-team-api.types';

const APP_ROLE_TO_TEAM_ROLE: Partial<
  Record<AppRoleCode, ReportTeamMemberRoleWire>
> = {
  [AppRoleCode.HUNTER]: 'hunter',
  [AppRoleCode.MENTOR]: 'mentor',
  [AppRoleCode.QUALITY_CHECKER]: 'quality_checker',
};

export function reportTeamRoleFromAppRoleCode(
  roleCode: AppRoleCode | null | undefined,
): ReportTeamMemberRoleWire {
  if (roleCode === undefined || roleCode === null) {
    throw new ForbiddenException('User role is not available');
  }
  const teamRole = APP_ROLE_TO_TEAM_ROLE[roleCode];
  if (teamRole === undefined) {
    throw new BadRequestException(
      `Account role "${roleCode}" cannot be assigned to a report team`,
    );
  }
  return teamRole;
}

export function reportTeamRoleFromIdentity(identity: Identity): ReportTeamMemberRoleWire {
  return reportTeamRoleFromAppRoleCode(identity.roleCode);
}

export function parseAppRoleCodeFromRoleName(
  roleName: string | null | undefined,
): AppRoleCode | null {
  if (roleName === undefined || roleName === null) {
    return null;
  }
  const values = Object.values(AppRoleCode) as string[];
  return values.includes(roleName) ? (roleName as AppRoleCode) : null;
}
