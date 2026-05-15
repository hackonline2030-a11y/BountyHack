import { Injectable, NotFoundException } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamWire } from '../../models/report-team-api.types';
import type { IReportTeamRepository } from '../../ports/report-team-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class GetReportTeamByIdQuery {
  constructor(
    private readonly repository: IReportTeamRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(identity: Identity, teamId: string): Promise<ReportTeamWire> {
    const team = await this.repository.findById(teamId);
    if (team === null) {
      throw new NotFoundException('Report team not found');
    }
    if (this.access.isCoordinatorOrSuperAdmin(identity)) {
      return team;
    }
    const isMember = team.members.some((m) => m.userId === identity.uid);
    if (!isMember) {
      throw new NotFoundException('Report team not found');
    }
    return team;
  }
}
