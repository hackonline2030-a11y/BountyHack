import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Identity } from '../../../auth/domain/models/identity';
import { GlobalSubmissionPrismaMapper } from '../../adapters/postgre-prisma/global-submission-prisma.mapper';
import type { GlobalSubmissionWire } from '../../models/global-submission-api.types';
import type { IGlobalSubmissionRepository } from '../../ports/global-submission-repository.interface';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class CreateGlobalSubmissionCommand {
  constructor(
    private readonly globalSubmissionRepository: IGlobalSubmissionRepository,
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(identity: Identity, draftId: string): Promise<GlobalSubmissionWire[]> {
    await this.access.assertActingHunterWriter(identity, draftId);

    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }

    if (draft.aggregateStatus !== 'under-global-review') {
      throw new BadRequestException(
        'Global submit is only allowed while the draft is under-global-review',
      );
    }
    if (!draft.superAdminRevisionRequestedAt?.trim()) {
      throw new BadRequestException('No open super-admin global revision on this draft');
    }

    let revisionNumber = draft.superAdminGlobalRevisionCount ?? 0;
    if (revisionNumber < 1) {
      throw new BadRequestException('Invalid global revision number on draft');
    }

    const existing = await this.globalSubmissionRepository.findByDraftId(draftId);
    const rowsForRevision = existing.filter((g) => g.revisionNumber === revisionNumber);

    if (rowsForRevision.some((g) => g.decision === 'pending')) {
      throw new BadRequestException(
        'A global submission is still awaiting reviewer decisions for this revision',
      );
    }

    if (rowsForRevision.length > 0) {
      revisionNumber += 1;
    }

    const payload = GlobalSubmissionPrismaMapper.draftSnapshotFromWire(draft);
    const submittedAt = new Date().toISOString();

    return this.globalSubmissionRepository.submitDualTracksForReview({
      reportDraftId: draftId,
      revisionNumber,
      payload,
      submittedAt,
      submittedBy: identity.uid,
      qcId: randomUUID(),
      superAdminId: randomUUID(),
    });
  }
}
