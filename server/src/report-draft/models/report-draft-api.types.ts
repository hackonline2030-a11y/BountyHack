/**
 * Wire-format types for report drafts — mirrors the client
 * `ReportDraftDomainModel` JSON exchanged via BFF / Nest.
 */

import type { ReportTeamMemberWire } from '../../report-team/models/report-team-api.types';

/** Coordinator-chosen title + squad; server-only enrichment, not persisted from client PUT. */
export interface ReportDraftTeamWire {
  label: string;
  members: ReportTeamMemberWire[];
}

export type AggregateStatusWire =
  | 'draft'
  | 'under-review'
  | 'under-global-review'
  | 'ready-to-program'
  /** @deprecated Prefer `published`. */
  | 'submitted-to-program'
  /** Super-admin validated — source of truth for PDF generation. */
  | 'published'
  | 'given-up'
  | 'rejected';

export type StepStatusWire =
  | 'in-progress'
  | 'awaiting-review'
  | 'needs-revision'
  | 'approved'
  | 'in-global-progress'
  | 'needs-global-revision'
  | 'awaiting-global-review';

export type ReviewerRoleWire =
  | 'hunter'
  | 'mentor'
  | 'quality_checker'
  | 'super_admin';

export type SubmissionDecisionWire =
  | 'pending'
  | 'approve'
  | 'request-changes'
  | 'endorse';

/** Numeric wizard step (client `ReportDraftStep` enum 0–7). */
export type SubmissionStepWire = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AttachmentWire {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface StepStateWire<TPayload = Record<string, unknown>> {
  payload: TPayload;
  attachments: AttachmentWire[];
  status: StepStatusWire;
  currentRound: number;
  assignedReviewerRole: ReviewerRoleWire | null;
}

export type ReportDraftStepStateKeyWire =
  | 'meta'
  | 'description'
  | 'collection'
  | 'exploitation'
  | 'proofOfConcept'
  | 'risks'
  | 'remediation'
  | 'final';

export interface ReportDraftWire {
  id: string;
  hunterId: string;
  /** User allowed to edit the draft and submit steps (defaults to owner at creation). */
  hunterWriterId: string;
  version: number;
  aggregateStatus: AggregateStatusWire;
  meta: StepStateWire;
  description: StepStateWire;
  collection: StepStateWire;
  exploitation: StepStateWire;
  proofOfConcept: StepStateWire;
  risks: StepStateWire;
  remediation: StepStateWire;
  final: StepStateWire;
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp when super-admin requested a global final-validation revision. */
  superAdminRevisionRequestedAt?: string | null;
  /** Number of super-admin global revision cycles requested (monotonic). */
  superAdminGlobalRevisionCount?: number;
  /** Associated report-team (label + members) when one exists — read-only from client saves. */
  reportTeam?: ReportDraftTeamWire | null;
  /** Pending program report created when super-admin submits to the program. */
}

export const REPORT_DRAFT_STEP_STATE_KEYS: readonly ReportDraftStepStateKeyWire[] =
  [
    'meta',
    'description',
    'collection',
    'exploitation',
    'proofOfConcept',
    'risks',
    'remediation',
    'final',
  ] as const;

export interface SubmissionWire {
  id: string;
  reportDraftId: string;
  step: SubmissionStepWire;
  round: number;
  payload: Record<string, unknown>;
  attachmentsSnapshot: AttachmentWire[];
  submittedAt: string;
  submittedBy: string;
  reviewerRole: ReviewerRoleWire;
  decision: SubmissionDecisionWire;
  decidedAt?: string;
  decidedBy?: string;
}

export interface ReviewerCommentAnchorWire {
  field: string;
  lineStart?: number;
  lineEnd?: number;
  attachmentId?: string;
}

export interface ReviewerCommentWire {
  id: string;
  submissionId: string;
  authorId: string;
  authorRole: ReviewerRoleWire;
  anchor?: ReviewerCommentAnchorWire;
  body: string;
  createdAt: string;
  resolvedAt?: string;
}
