import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamJoinRequestWire } from '../../models/report-team-api.types';
import type { IJoinRequestRepository } from '../../ports/join-request-repository.interface';

@Injectable()
export class ListMyJoinRequestsQuery {
  constructor(private readonly repository: IJoinRequestRepository) {}

  async execute(identity: Identity): Promise<ReportTeamJoinRequestWire[]> {
    return this.repository.findByUserId(identity.uid);
  }
}
