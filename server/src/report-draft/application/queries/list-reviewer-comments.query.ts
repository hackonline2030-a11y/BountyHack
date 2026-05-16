import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReviewerCommentWire } from '../../models/report-draft-api.types';
import type { IReviewerCommentRepository } from '../../ports/reviewer-comment-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class ListReviewerCommentsQuery {
  constructor(
    private readonly repository: IReviewerCommentRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    submissionId: string,
  ): Promise<ReviewerCommentWire[]> {
    await this.access.assertCanReadComments(identity, submissionId);
    return this.repository.findBySubmissionId(submissionId);
  }
}
