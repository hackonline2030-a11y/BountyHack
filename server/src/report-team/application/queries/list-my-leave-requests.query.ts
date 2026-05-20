import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamLeaveRequestWire } from '../../models/report-team-api.types';
import type { ILeaveRequestRepository } from '../../ports/leave-request-repository.interface';

@Injectable()
export class ListMyLeaveRequestsQuery {
  constructor(private readonly repository: ILeaveRequestRepository) {}

  async execute(identity: Identity): Promise<ReportTeamLeaveRequestWire[]> {
    return this.repository.findByUserId(identity.uid);
  }
}
