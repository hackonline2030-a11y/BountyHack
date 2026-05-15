import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftWire } from '../../models/report-draft-api.types';

@Injectable()
export class SaveReportDraftCommand {
  constructor(private readonly repository: IReportDraftRepository) {}

  async execute(identity: Identity, draft: ReportDraftWire): Promise<void> {
    if (draft.hunterId !== identity.uid) {
      throw new ForbiddenException(
        'Cannot save a report draft owned by another hunter',
      );
    }
    await this.repository.save(draft);
  }
}
