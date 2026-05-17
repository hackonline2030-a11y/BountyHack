import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { GlobalReviewerCommentWire } from '../../models/global-submission-api.types';
import type { IGlobalSubmissionRepository } from '../../ports/global-submission-repository.interface';
import type { IGlobalReviewerCommentRepository } from '../../ports/global-reviewer-comment-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class ListGlobalReviewerCommentsQuery {
  constructor(
    private readonly globalSubmissionRepository: IGlobalSubmissionRepository,
    private readonly commentRepository: IGlobalReviewerCommentRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    globalSubmissionId: string,
  ): Promise<GlobalReviewerCommentWire[]> {
    const globalSubmission =
      await this.globalSubmissionRepository.findById(globalSubmissionId);
    if (globalSubmission === null) {
      return [];
    }
    await this.access.assertCanReadGlobalSubmission(identity, globalSubmission);
    return this.commentRepository.findByGlobalSubmissionId(globalSubmissionId);
  }
}
