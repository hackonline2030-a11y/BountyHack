import { ForbiddenException, Injectable } from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import type { ReportTeamWire } from '../models/report-team-api.types';
import type { IReportTeamRepository } from '../ports/report-team-repository.interface';

@Injectable()
export class ReportTeamAccessPolicy {
  constructor(private readonly teamRepository: IReportTeamRepository) {}

  assertCoordinatorOrSuperAdmin(identity: Identity): void {
    if (!this.isCoordinatorOrSuperAdmin(identity)) {
      throw new ForbiddenException('Coordinator or super admin required');
    }
  }

  isCoordinatorOrSuperAdmin(identity: Identity): boolean {
    return this.isCoordinator(identity) || this.isSuperAdmin(identity);
  }

  assertSuperAdmin(identity: Identity): void {
    if (!this.isSuperAdmin(identity)) {
      throw new ForbiddenException('Super admin required');
    }
  }

  async assertCanReadTeam(identity: Identity, teamId: string): Promise<ReportTeamWire> {
    const team = await this.teamRepository.findById(teamId);
    if (team === null) {
      throw new ForbiddenException('Cannot access this report team');
    }
    if (this.isCoordinator(identity) || this.isSuperAdmin(identity)) {
      return team;
    }
    const isMember = team.members.some((m) => m.userId === identity.uid);
    if (!isMember) {
      throw new ForbiddenException('Cannot access this report team');
    }
    return team;
  }

  assertCanRequestJoin(identity: Identity, userId: string): void {
    if (identity.uid !== userId) {
      throw new ForbiddenException('Cannot create a join request for another user');
    }
  }

  private isCoordinator(identity: Identity): boolean {
    return identity.roleCode === AppRoleCode.COORDINATOR;
  }

  private isSuperAdmin(identity: Identity): boolean {
    return identity.roleCode === AppRoleCode.SUPER_ADMIN;
  }
}
