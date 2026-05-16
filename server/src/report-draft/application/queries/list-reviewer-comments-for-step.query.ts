import { Injectable, NotFoundException } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReviewerCommentWire } from '../../models/report-draft-api.types';
import type { IReviewerCommentRepository } from '../../ports/reviewer-comment-repository.interface';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

/**
 * Returns mentor + QC comments for the same wizard step (all rounds/submissions on that step).
 */
@Injectable()
export class ListReviewerCommentsForStepQuery {
  constructor(
    private readonly commentRepository: IReviewerCommentRepository,
    private readonly submissionRepository: ISubmissionRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    submissionId: string,
  ): Promise<ReviewerCommentWire[]> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (submission === null) {
      throw new NotFoundException('Submission not found');
    }
    await this.access.assertCanReadSubmission(identity, submission);
    return this.commentRepository.findByReportDraftStep(
      submission.reportDraftId,
      submission.step,
    );
  }
}
