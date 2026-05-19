import type { GlobalReviewerCommentWire } from '../models/global-submission-api.types';

export interface IGlobalReviewerCommentRepository {
  saveMany(comments: ReadonlyArray<GlobalReviewerCommentWire>): Promise<void>;
  findByGlobalSubmissionId(globalSubmissionId: string): Promise<GlobalReviewerCommentWire[]>;
}

export const I_GLOBAL_REVIEWER_COMMENT_REPOSITORY = Symbol(
  'I_GLOBAL_REVIEWER_COMMENT_REPOSITORY',
);
