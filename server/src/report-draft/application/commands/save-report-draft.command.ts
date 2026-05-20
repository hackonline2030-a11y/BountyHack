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
    const existing = await this.repository.findById(draft.id);
    if (!existing) {
      throw new NotFoundException('Report draft not found');
    }

    // Authorize against persisted metadata — never trust hunter_id / hunter_writer_id from the body.
    await this.access.assertCanSaveDraft(identity, existing);

    const {
      reportTeam: _readOnlyTeam,
      superAdminRevisionRequestedAt: _revisionMarker,
      superAdminGlobalRevisionCount: _revisionCount,
      ...rest
    } = draft;
    const toPersist: ReportDraftWire = {
      ...rest,
      hunterId: existing.hunterId,
      hunterWriterId: existing.hunterWriterId,
    };
    await this.repository.save(toPersist);
  }
}
