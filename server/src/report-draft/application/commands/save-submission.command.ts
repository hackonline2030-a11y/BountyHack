import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { SubmissionWire } from '../../models/report-draft-api.types';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class SaveSubmissionCommand {
  constructor(
    private readonly repository: ISubmissionRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(identity: Identity, submission: SubmissionWire): Promise<void> {
    await this.access.assertCanSaveSubmission(identity, submission);
    await this.repository.save(submission);
  }
}
