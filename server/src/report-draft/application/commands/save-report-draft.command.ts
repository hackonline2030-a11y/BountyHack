import { Injectable, NotFoundException } from '@nestjs/common';
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

    const existing = await this.repository.findById(draft.id);
    if (!existing) {
      throw new NotFoundException('Report draft not found');
    }

    const { reportTeam: _readOnlyTeam, ...toPersist } = draft;
    await this.repository.save(toPersist);
  }
}
