import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import type { IGlobalSubmissionRepository } from '../../ports/global-submission-repository.interface';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class ApproveGlobalSubmissionCommand {
  constructor(
    private readonly globalSubmissionRepository: IGlobalSubmissionRepository,
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    globalSubmissionId: string,
  ): Promise<ReportDraftWire> {
    const globalSubmission =
      await this.globalSubmissionRepository.findById(globalSubmissionId);
    if (globalSubmission === null) {
      throw new NotFoundException('Global submission not found');
    }

    await this.access.assertCanDecideGlobalSubmission(identity, globalSubmission);

    if (globalSubmission.decision !== 'pending') {
      throw new BadRequestException('Global submission has already been decided');
    }

    await this.globalSubmissionRepository.recordDecision({
      globalSubmissionId,
      decision: 'approve',
      decidedBy: identity.uid,
    });

    const draft = await this.reportDraftRepository.findById(
      globalSubmission.reportDraftId,
    );
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    return draft;
  }
}
