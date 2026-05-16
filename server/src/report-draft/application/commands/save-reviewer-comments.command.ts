import { BadRequestException, Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { ReviewerCommentWire } from '../../models/report-draft-api.types';
import type { IReviewerCommentRepository } from '../../ports/reviewer-comment-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

@Injectable()
export class SaveReviewerCommentsCommand {
  constructor(
    private readonly repository: IReviewerCommentRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    comments: ReadonlyArray<ReviewerCommentWire>,
  ): Promise<void> {
    if (comments.length === 0) {
      return;
    }
    const submissionId = comments[0].submissionId;
    if (!comments.every((c) => c.submissionId === submissionId)) {
      throw new BadRequestException(
        'All comments must belong to the same submission',
      );
    }
    await this.access.assertCanSaveComments(
      identity,
      submissionId,
      comments.map((c) => c.authorId),
    );
    await this.repository.saveMany(comments);
  }
}
