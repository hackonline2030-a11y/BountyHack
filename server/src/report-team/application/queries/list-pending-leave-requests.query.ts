import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamLeaveRequestWire } from '../../models/report-team-api.types';
import type { ILeaveRequestRepository } from '../../ports/leave-request-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class ListPendingLeaveRequestsQuery {
  constructor(
    private readonly repository: ILeaveRequestRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(identity: Identity): Promise<ReportTeamLeaveRequestWire[]> {
    this.access.assertCoordinatorOrSuperAdmin(identity);
    return this.repository.findPending();
  }
}
