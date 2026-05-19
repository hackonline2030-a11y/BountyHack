import type { GlobalSubmissionWire } from '../models/global-submission-api.types';
import type { ReviewerRoleWire } from '../models/report-draft-api.types';

export interface IGlobalSubmissionRepository {
  save(globalSubmission: GlobalSubmissionWire): Promise<void>;
  findById(id: string): Promise<GlobalSubmissionWire | null>;
  findByDraftId(draftId: string): Promise<GlobalSubmissionWire[]>;
  findPendingForReviewerRole(
    reviewerRole: ReviewerRoleWire,
  ): Promise<GlobalSubmissionWire[]>;
  findPendingForReviewerRoleInDrafts(
    reviewerRole: ReviewerRoleWire,
    draftIds: readonly string[] | null,
  ): Promise<GlobalSubmissionWire[]>;
  findAllForReviewerRole(
    reviewerRole: ReviewerRoleWire,
  ): Promise<GlobalSubmissionWire[]>;
  findAllForReviewerRoleInDrafts(
    reviewerRole: ReviewerRoleWire,
    draftIds: readonly string[] | null,
  ): Promise<GlobalSubmissionWire[]>;

  /** Persist global submission + set all steps to awaiting-review (single transaction). */
  submitForReview(globalSubmission: GlobalSubmissionWire): Promise<void>;

  /**
   * Hunter (re)submit: QC + super-admin tracks for the same revision.
   * Resets decided rows when resubmitting after feedback.
   */
  submitDualTracksForReview(input: {
    reportDraftId: string;
    revisionNumber: number;
    payload: GlobalSubmissionWire['payload'];
    submittedAt: string;
    submittedBy: string;
    qcId: string;
    superAdminId: string;
  }): Promise<GlobalSubmissionWire[]>;

  /** Record QC/mentor decision and sync all step statuses + draft aggregate status. */
  recordDecision(input: {
    globalSubmissionId: string;
    decision: 'approve' | 'request-changes';
    decidedBy: string;
  }): Promise<void>;
}

export const I_GLOBAL_SUBMISSION_REPOSITORY = Symbol(
  'I_GLOBAL_SUBMISSION_REPOSITORY',
);
