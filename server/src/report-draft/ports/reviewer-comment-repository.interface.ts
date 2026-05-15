import type { ReviewerCommentWire } from '../models/report-draft-api.types';

export interface IReviewerCommentRepository {
  saveMany(comments: ReadonlyArray<ReviewerCommentWire>): Promise<void>;
  findBySubmissionId(submissionId: string): Promise<ReviewerCommentWire[]>;
}

export const I_REVIEWER_COMMENT_REPOSITORY = Symbol(
  'I_REVIEWER_COMMENT_REPOSITORY',
);
