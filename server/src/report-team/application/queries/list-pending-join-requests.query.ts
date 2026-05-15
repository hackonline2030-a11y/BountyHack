import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamJoinRequestWire } from '../../models/report-team-api.types';
import type { IJoinRequestRepository } from '../../ports/join-request-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class ListPendingJoinRequestsQuery {
  constructor(
    private readonly repository: IJoinRequestRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(identity: Identity): Promise<ReportTeamJoinRequestWire[]> {
    this.access.assertCoordinatorOrSuperAdmin(identity);
    return this.repository.findPending();
  }
}
