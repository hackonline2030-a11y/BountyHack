import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftWire } from '../../models/report-draft-api.types';

@Injectable()
export class GetReportDraftByIdQuery {
  constructor(private readonly repository: IReportDraftRepository) {}

  async execute(
    identity: Identity,
    draftId: string,
  ): Promise<ReportDraftWire | null> {
    const draft = await this.repository.findById(draftId);
    if (draft === null) {
      return null;
    }
    if (draft.hunterId !== identity.uid) {
      throw new ForbiddenException('Cannot access this report draft');
    }
    return draft;
  }
}
