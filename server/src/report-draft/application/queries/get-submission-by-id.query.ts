import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { SubmissionWire } from '../../models/report-draft-api.types';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class GetSubmissionByIdQuery {
  constructor(
    private readonly repository: ISubmissionRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    submissionId: string,
  ): Promise<SubmissionWire | null> {
    const submission = await this.repository.findById(submissionId);
    if (submission === null) {
      return null;
    }
    await this.access.assertCanReadSubmission(identity, submission);
    return submission;
  }
}
