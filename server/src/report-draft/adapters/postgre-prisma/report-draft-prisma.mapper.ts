import {
  DraftStep,
  ReportDraftAggregateStatus,
  ReviewerRole,
  StepStatus,
} from '../../../generated/prisma/enums';
import type {
  ReportDraft,
  ReportDraftAttachment,
  ReportDraftStep,
  ReportTeam,
  ReportTeamMember,
  User,
} from '../../../generated/prisma/client';
import { ReportTeamPrismaMapper } from '../../../report-team/adapters/postgre-prisma/report-team-prisma.mapper';
import {
  REPORT_DRAFT_STEP_STATE_KEYS,
  type AggregateStatusWire,
  type AttachmentWire,
  type ReportDraftStepStateKeyWire,
  type ReportDraftWire,
  type ReviewerRoleWire,
  type StepStateWire,
  type StepStatusWire,
} from '../../models/report-draft-api.types';

export type ReportTeamWithMembersRow = ReportTeam & {
  members: (ReportTeamMember & { user: User })[];
};

export type ReportDraftWithSteps = ReportDraft & {
  steps: (ReportDraftStep & { attachments: ReportDraftAttachment[] })[];
  reportTeam?: ReportTeamWithMembersRow | null;
};

const STATE_KEY_BY_DRAFT_STEP: Record<DraftStep, ReportDraftStepStateKeyWire> = {
  [DraftStep.META]: 'meta',
  [DraftStep.DESCRIPTION]: 'description',
  [DraftStep.COLLECTION]: 'collection',
  [DraftStep.EXPLOITATION]: 'exploitation',
  [DraftStep.PROOF_OF_CONCEPT]: 'proofOfConcept',
  [DraftStep.RISKS]: 'risks',
  [DraftStep.REMEDIATION]: 'remediation',
  [DraftStep.FINAL]: 'final',
};

const DRAFT_STEP_BY_STATE_KEY: Record<ReportDraftStepStateKeyWire, DraftStep> = {
  meta: DraftStep.META,
  description: DraftStep.DESCRIPTION,
  collection: DraftStep.COLLECTION,
  exploitation: DraftStep.EXPLOITATION,
  proofOfConcept: DraftStep.PROOF_OF_CONCEPT,
  risks: DraftStep.RISKS,
  remediation: DraftStep.REMEDIATION,
  final: DraftStep.FINAL,
};

const DRAFT_STEP_ORDER: DraftStep[] = [
  DraftStep.META,
  DraftStep.DESCRIPTION,
  DraftStep.COLLECTION,
  DraftStep.EXPLOITATION,
  DraftStep.PROOF_OF_CONCEPT,
  DraftStep.RISKS,
  DraftStep.REMEDIATION,
  DraftStep.FINAL,
];

const AGGREGATE_STATUS_TO_WIRE: Record<
  ReportDraftAggregateStatus,
  AggregateStatusWire
> = {
  [ReportDraftAggregateStatus.DRAFT]: 'draft',
  [ReportDraftAggregateStatus.UNDER_REVIEW]: 'under-review',
  [ReportDraftAggregateStatus.READY_TO_PROGRAM]: 'ready-to-program',
  [ReportDraftAggregateStatus.SUBMITTED_TO_PROGRAM]: 'submitted-to-program',
  [ReportDraftAggregateStatus.GIVEN_UP]: 'given-up',
  [ReportDraftAggregateStatus.REJECTED]: 'rejected',
};

const AGGREGATE_STATUS_FROM_WIRE: Record<
  AggregateStatusWire,
  ReportDraftAggregateStatus
> = {
  draft: ReportDraftAggregateStatus.DRAFT,
  'under-review': ReportDraftAggregateStatus.UNDER_REVIEW,
  'ready-to-program': ReportDraftAggregateStatus.READY_TO_PROGRAM,
  'submitted-to-program': ReportDraftAggregateStatus.SUBMITTED_TO_PROGRAM,
  'given-up': ReportDraftAggregateStatus.GIVEN_UP,
  rejected: ReportDraftAggregateStatus.REJECTED,
};

const STEP_STATUS_TO_WIRE: Record<StepStatus, StepStatusWire> = {
  [StepStatus.IN_PROGRESS]: 'in-progress',
  [StepStatus.AWAITING_REVIEW]: 'awaiting-review',
  [StepStatus.NEEDS_REVISION]: 'needs-revision',
  [StepStatus.APPROVED]: 'approved',
};

const STEP_STATUS_FROM_WIRE: Record<StepStatusWire, StepStatus> = {
  'in-progress': StepStatus.IN_PROGRESS,
  'awaiting-review': StepStatus.AWAITING_REVIEW,
  'needs-revision': StepStatus.NEEDS_REVISION,
  approved: StepStatus.APPROVED,
};

const REVIEWER_ROLE_TO_WIRE: Record<ReviewerRole, ReviewerRoleWire> = {
  [ReviewerRole.HUNTER]: 'hunter',
  [ReviewerRole.MENTOR]: 'mentor',
  [ReviewerRole.QUALITY_CHECKER]: 'quality_checker',
  [ReviewerRole.SUPER_ADMIN]: 'super_admin',
};

const REVIEWER_ROLE_FROM_WIRE: Record<ReviewerRoleWire, ReviewerRole> = {
  hunter: ReviewerRole.HUNTER,
  mentor: ReviewerRole.MENTOR,
  quality_checker: ReviewerRole.QUALITY_CHECKER,
  super_admin: ReviewerRole.SUPER_ADMIN,
};

export class ReportDraftPrismaMapper {
  static aggregateStatusFromWire(
    status: AggregateStatusWire,
  ): ReportDraftAggregateStatus {
    return AGGREGATE_STATUS_FROM_WIRE[status];
  }

  static aggregateStatusToWire(
    status: ReportDraftAggregateStatus,
  ): AggregateStatusWire {
    return AGGREGATE_STATUS_TO_WIRE[status];
  }

  static toDomain(row: ReportDraftWithSteps): ReportDraftWire {
    const draft: ReportDraftWire = {
      id: row.id,
      hunterId: row.hunterId,
      version: row.version,
      aggregateStatus: AGGREGATE_STATUS_TO_WIRE[row.aggregateStatus],
      meta: emptyStepState(),
      description: emptyStepState(),
      collection: emptyStepState(),
      exploitation: emptyStepState(),
      proofOfConcept: emptyStepState(),
      risks: emptyStepState(),
      remediation: emptyStepState(),
      final: emptyStepState(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };

    for (const stepRow of row.steps) {
      const key = STATE_KEY_BY_DRAFT_STEP[stepRow.step];
      draft[key] = this.stepRowToWire(stepRow);
    }

    for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
      if (!row.steps.some((s) => STATE_KEY_BY_DRAFT_STEP[s.step] === key)) {
        draft[key] = emptyStepState();
      }
    }

    draft.reportTeam = row.reportTeam
      ? {
          label: row.reportTeam.label,
          members: row.reportTeam.members.map((m) =>
            ReportTeamPrismaMapper.memberToWire(m),
          ),
        }
      : null;

    return draft;
  }

  static stepRowsFromWire(
    draft: ReportDraftWire,
  ): Array<{
    step: DraftStep;
    payload: object;
    status: StepStatus;
    currentRound: number;
    assignedReviewerRole: ReviewerRole | null;
    attachments: AttachmentWire[];
  }> {
    return DRAFT_STEP_ORDER.map((step) => {
      const key = STATE_KEY_BY_DRAFT_STEP[step];
      const state = draft[key];
      return {
        step,
        payload: state.payload as object,
        status: STEP_STATUS_FROM_WIRE[state.status],
        currentRound: state.currentRound,
        assignedReviewerRole: state.assignedReviewerRole
          ? REVIEWER_ROLE_FROM_WIRE[state.assignedReviewerRole]
          : null,
        attachments: state.attachments,
      };
    });
  }

  static draftHeaderFromWire(draft: ReportDraftWire): {
    id: string;
    hunterId: string;
    version: number;
    aggregateStatus: ReportDraftAggregateStatus;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: draft.id,
      hunterId: draft.hunterId,
      version: draft.version,
      aggregateStatus: AGGREGATE_STATUS_FROM_WIRE[draft.aggregateStatus],
      createdAt: new Date(draft.createdAt),
      updatedAt: new Date(draft.updatedAt),
    };
  }

  private static stepRowToWire(
    stepRow: ReportDraftStep & { attachments: ReportDraftAttachment[] },
  ): StepStateWire {
    return {
      payload: stepRow.payload as Record<string, unknown>,
      attachments: stepRow.attachments.map((a) => this.attachmentToWire(a)),
      status: STEP_STATUS_TO_WIRE[stepRow.status],
      currentRound: stepRow.currentRound,
      assignedReviewerRole: stepRow.assignedReviewerRole
        ? REVIEWER_ROLE_TO_WIRE[stepRow.assignedReviewerRole]
        : null,
    };
  }

  private static attachmentToWire(row: ReportDraftAttachment): AttachmentWire {
    return {
      id: row.id,
      filename: row.filename,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      uploadedAt: row.uploadedAt.toISOString(),
      uploadedBy: row.uploadedBy,
    };
  }

  static attachmentCreateInput(
    stepId: string,
    attachment: AttachmentWire,
  ): {
    id: string;
    reportDraftStepId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    thumbnailUrl: string | null;
    uploadedBy: string;
    uploadedAt: Date;
  } {
    return {
      id: attachment.id,
      reportDraftStepId: stepId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      storageKey: attachment.storageKey,
      thumbnailUrl: attachment.thumbnailUrl ?? null,
      uploadedBy: attachment.uploadedBy,
      uploadedAt: new Date(attachment.uploadedAt),
    };
  }
}

function emptyStepState(): StepStateWire {
  return {
    payload: {},
    attachments: [],
    status: 'in-progress',
    currentRound: 0,
    assignedReviewerRole: null,
  };
}

/** Exported for tests */
export const reportDraftMapperInternals = {
  STATE_KEY_BY_DRAFT_STEP,
  DRAFT_STEP_BY_STATE_KEY,
  AGGREGATE_STATUS_TO_WIRE,
  AGGREGATE_STATUS_FROM_WIRE,
};
