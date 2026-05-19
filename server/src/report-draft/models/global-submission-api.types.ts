import type {
  ReportDraftStepStateKeyWire,
  ReportDraftWire,
  ReviewerRoleWire,
  StepStateWire,
} from './report-draft-api.types';

/** Frozen snapshot of all wizard steps at global submit time. */
export type GlobalSubmissionDraftSnapshotWire = Pick<
  ReportDraftWire,
  ReportDraftStepStateKeyWire
>;

export type GlobalSubmissionWire = {
  id: string;
  reportDraftId: string;
  revisionNumber: number;
  payload: GlobalSubmissionDraftSnapshotWire;
  submittedAt: string;
  submittedBy: string;
  reviewerRole: ReviewerRoleWire;
  decision: 'pending' | 'approve' | 'request-changes' | 'endorse';
  decidedAt?: string;
  decidedBy?: string;
};

export type GlobalReviewerCommentWire = {
  id: string;
  globalSubmissionId: string;
  authorId: string;
  authorRole: ReviewerRoleWire;
  anchor?: { field: string } | null;
  body: string;
  createdAt: string;
  resolvedAt?: string;
};
