import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class SaveReportDraftCommand {
  constructor(
    private readonly repository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(identity: Identity, draft: ReportDraftWire): Promise<void> {
    this.access.assertCanSaveDraft(identity, draft);
    await this.repository.save(draft);
  }
}
