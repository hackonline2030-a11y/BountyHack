import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { GlobalSubmissionWire } from '../../models/global-submission-api.types';
import type { IGlobalSubmissionRepository } from '../../ports/global-submission-repository.interface';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class GetGlobalSubmissionByIdQuery {
  constructor(
    private readonly globalSubmissionRepository: IGlobalSubmissionRepository,
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    globalSubmissionId: string,
  ): Promise<GlobalSubmissionWire | null> {
    const row = await this.globalSubmissionRepository.findById(globalSubmissionId);
    if (row === null) {
      return null;
    }
    const draft = await this.reportDraftRepository.findById(row.reportDraftId);
    if (draft === null) {
      return null;
    }
    await this.access.assertCanReadDraft(identity, draft);
    return row;
  }
}
