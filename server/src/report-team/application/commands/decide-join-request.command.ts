import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamJoinRequestWire } from '../../models/report-team-api.types';
import type { IJoinRequestRepository } from '../../ports/join-request-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class DecideJoinRequestCommand {
  constructor(
    private readonly repository: IJoinRequestRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    requestId: string,
    decision: 'approve' | 'reject',
  ): Promise<ReportTeamJoinRequestWire> {
    this.access.assertCoordinatorOrSuperAdmin(identity);
    if (decision === 'approve') {
      return this.repository.approve(requestId, identity.uid);
    }
    return this.repository.reject(requestId, identity.uid);
  }
}
