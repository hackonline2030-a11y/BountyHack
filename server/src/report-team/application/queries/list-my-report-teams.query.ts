import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamWire } from '../../models/report-team-api.types';
import type { IReportTeamRepository } from '../../ports/report-team-repository.interface';

@Injectable()
export class ListMyReportTeamsQuery {
  constructor(private readonly repository: IReportTeamRepository) {}

  async execute(identity: Identity): Promise<ReportTeamWire[]> {
    return this.repository.findByMemberUserId(identity.uid);
  }
}
