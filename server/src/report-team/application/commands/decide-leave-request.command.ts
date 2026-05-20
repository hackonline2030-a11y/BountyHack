import { Injectable, NotFoundException } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportTeamLeaveRequestWire } from '../../models/report-team-api.types';
import type { ILeaveRequestRepository } from '../../ports/leave-request-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class DecideLeaveRequestCommand {
  constructor(
    private readonly repository: ILeaveRequestRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    requestId: string,
    decision: 'approve' | 'reject',
  ): Promise<ReportTeamLeaveRequestWire> {
    this.access.assertCoordinatorOrSuperAdmin(identity);
    const existing = await this.repository.findById(requestId);
    if (existing === null) {
      throw new NotFoundException('Leave request not found');
    }
    return decision === 'approve'
      ? this.repository.approve(requestId, identity.uid)
      : this.repository.reject(requestId, identity.uid);
  }
}
