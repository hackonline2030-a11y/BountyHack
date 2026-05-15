/**
 * Wire-format types for report drafts — mirrors the client
 * `ReportDraftDomainModel` JSON exchanged via BFF / Nest.
 */

export type AggregateStatusWire =
  | 'draft'
  | 'under-review'
  | 'ready-to-program'
  | 'submitted-to-program'
  | 'given-up'
  | 'rejected';

export type StepStatusWire =
  | 'in-progress'
  | 'awaiting-review'
  | 'needs-revision'
  | 'approved';

export type ReviewerRoleWire =
  | 'hunter'
  | 'mentor'
  | 'quality_checker'
  | 'super_admin';

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
