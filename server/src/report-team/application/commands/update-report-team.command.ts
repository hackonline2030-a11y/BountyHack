import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  ReportTeamWire,
  UpdateReportTeamInput,
} from '../../models/report-team-api.types';
import type { IReportTeamRepository } from '../../ports/report-team-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class UpdateReportTeamCommand {
  constructor(
    private readonly repository: IReportTeamRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    teamId: string,
    input: UpdateReportTeamInput,
  ): Promise<ReportTeamWire> {
    this.access.assertCoordinatorOrSuperAdmin(identity);
    return this.repository.update(teamId, input);
  }
}
