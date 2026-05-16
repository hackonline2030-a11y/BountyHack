import type { ReviewerCommentWire } from '../models/report-draft-api.types';

export interface IReviewerCommentRepository {
  saveMany(comments: ReadonlyArray<ReviewerCommentWire>): Promise<void>;
  findBySubmissionId(submissionId: string): Promise<ReviewerCommentWire[]>;
  /** All comments on every submission for the same draft step (mentor + QC threads). */
  findByReportDraftStep(
    reportDraftId: string,
    step: number,
  ): Promise<ReviewerCommentWire[]>;
}

export const I_REVIEWER_COMMENT_REPOSITORY = Symbol(
  'I_REVIEWER_COMMENT_REPOSITORY',
);
