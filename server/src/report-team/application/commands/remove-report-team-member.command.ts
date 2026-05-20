import { Injectable, NotFoundException } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamWire } from '../../models/report-team-api.types';
import type { IReportTeamRepository } from '../../ports/report-team-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class RemoveReportTeamMemberCommand {
  constructor(
    private readonly repository: IReportTeamRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    teamId: string,
    memberUserId: string,
  ): Promise<ReportTeamWire> {
    const team = await this.repository.findById(teamId);
    if (team === null) {
      throw new NotFoundException('Report team not found');
    }
    const isMember = team.members.some((m) => m.userId === memberUserId);
    if (!isMember) {
      throw new NotFoundException('Team member not found');
    }
    if (identity.uid !== memberUserId) {
      this.access.assertCoordinatorOrSuperAdmin(identity);
    }
    return this.repository.removeMember(teamId, memberUserId);
  }
}
