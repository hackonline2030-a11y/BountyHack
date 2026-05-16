import type { ReviewerRoleWire, SubmissionWire } from '../models/report-draft-api.types';

export interface ISubmissionRepository {
  save(submission: SubmissionWire): Promise<void>;
  findById(id: string): Promise<SubmissionWire | null>;
  findByDraftId(draftId: string): Promise<SubmissionWire[]>;
  findPendingForReviewerRole(
    reviewerRole: ReviewerRoleWire,
  ): Promise<SubmissionWire[]>;
  findAllForReviewerRole(
    reviewerRole: ReviewerRoleWire,
  ): Promise<SubmissionWire[]>;

  findMentorSubmissionsForDraftIds(
    draftIds: readonly string[],
  ): Promise<SubmissionWire[]>;
}

export const I_SUBMISSION_REPOSITORY = Symbol('I_SUBMISSION_REPOSITORY');
