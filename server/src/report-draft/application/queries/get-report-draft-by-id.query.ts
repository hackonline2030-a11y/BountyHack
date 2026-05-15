import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class GetReportDraftByIdQuery {
  constructor(
    private readonly repository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    draftId: string,
  ): Promise<ReportDraftWire | null> {
    const draft = await this.repository.findById(draftId);
    if (draft === null) {
      return null;
    }
    this.access.assertCanReadDraft(identity, draft);
    return draft;
  }
}
