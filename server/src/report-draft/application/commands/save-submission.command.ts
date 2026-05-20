import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { SubmissionWire } from '../../models/report-draft-api.types';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import { applySubmissionDecisionToDraft } from '../report-draft-reviewer-sync';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class SaveSubmissionCommand {
  constructor(
    private readonly repository: ISubmissionRepository,
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(identity: Identity, submission: SubmissionWire): Promise<void> {
    await this.access.assertCanSaveSubmission(identity, submission);
    await this.repository.save(submission);

    if (submission.decision === 'pending') {
      return;
    }

    const draft = await this.reportDraftRepository.findById(submission.reportDraftId);
    if (draft === null) {
      return;
    }

    const synced = applySubmissionDecisionToDraft(draft, submission);
    if (synced !== null) {
      await this.reportDraftRepository.save(synced);
    }
  }
}
