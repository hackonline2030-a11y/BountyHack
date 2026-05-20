import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftWire } from '../../models/report-draft-api.types';

@Injectable()
export class ListReportDraftsByHunterQuery {
  constructor(private readonly repository: IReportDraftRepository) {}

  async execute(identity: Identity, hunterId: string): Promise<ReportDraftWire[]> {
    if (hunterId !== identity.uid) {
      throw new ForbiddenException('Cannot list drafts for another hunter');
    }
    return this.repository.findByHunterIdOrTeamMembership(hunterId);
  }
}
