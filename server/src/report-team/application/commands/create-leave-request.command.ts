import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  CreateLeaveRequestInput,
  ReportTeamLeaveRequestWire,
} from '../../models/report-team-api.types';
import type { ILeaveRequestRepository } from '../../ports/leave-request-repository.interface';
import { ReportTeamAccessPolicy } from '../report-team-access.policy';

@Injectable()
export class CreateLeaveRequestCommand {
  constructor(
    private readonly repository: ILeaveRequestRepository,
    private readonly access: ReportTeamAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    input: CreateLeaveRequestInput,
  ): Promise<ReportTeamLeaveRequestWire> {
    this.access.assertCanRequestJoin(identity, identity.uid);
    return this.repository.create(identity.uid, input);
  }
}
