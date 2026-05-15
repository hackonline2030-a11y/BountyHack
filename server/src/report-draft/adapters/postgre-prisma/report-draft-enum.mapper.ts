import {
  DraftStep,
  ReviewerRole,
  SubmissionDecision,
} from '../../../generated/prisma/enums';
import type {
  ReviewerRoleWire,
  SubmissionDecisionWire,
  SubmissionStepWire,
} from '../../models/report-draft-api.types';

const STEP_NUMBER_TO_DRAFT_STEP: Record<SubmissionStepWire, DraftStep> = {
  0: DraftStep.META,
  1: DraftStep.DESCRIPTION,
  2: DraftStep.COLLECTION,
  3: DraftStep.EXPLOITATION,
  4: DraftStep.PROOF_OF_CONCEPT,
  5: DraftStep.RISKS,
  6: DraftStep.REMEDIATION,
  7: DraftStep.FINAL,
};

const DRAFT_STEP_TO_STEP_NUMBER: Record<DraftStep, SubmissionStepWire> = {
  [DraftStep.META]: 0,
  [DraftStep.DESCRIPTION]: 1,
  [DraftStep.COLLECTION]: 2,
  [DraftStep.EXPLOITATION]: 3,
  [DraftStep.PROOF_OF_CONCEPT]: 4,
  [DraftStep.RISKS]: 5,
  [DraftStep.REMEDIATION]: 6,
  [DraftStep.FINAL]: 7,
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

const DECISION_TO_WIRE: Record<SubmissionDecision, SubmissionDecisionWire> = {
  [SubmissionDecision.PENDING]: 'pending',
  [SubmissionDecision.APPROVE]: 'approve',
  [SubmissionDecision.REQUEST_CHANGES]: 'request-changes',
  [SubmissionDecision.ENDORSE]: 'endorse',
};

const DECISION_FROM_WIRE: Record<SubmissionDecisionWire, SubmissionDecision> = {
  pending: SubmissionDecision.PENDING,
  approve: SubmissionDecision.APPROVE,
  'request-changes': SubmissionDecision.REQUEST_CHANGES,
  endorse: SubmissionDecision.ENDORSE,
};

export class ReportDraftEnumMapper {
  static draftStepFromStepNumber(step: SubmissionStepWire): DraftStep {
    const mapped = STEP_NUMBER_TO_DRAFT_STEP[step];
    if (!mapped) {
      throw new Error(`Invalid submission step number: ${step}`);
    }
    return mapped;
  }

  static stepNumberFromDraftStep(step: DraftStep): SubmissionStepWire {
    return DRAFT_STEP_TO_STEP_NUMBER[step];
  }

  static reviewerRoleToWire(role: ReviewerRole): ReviewerRoleWire {
    return REVIEWER_ROLE_TO_WIRE[role];
  }

  static reviewerRoleFromWire(role: ReviewerRoleWire): ReviewerRole {
    return REVIEWER_ROLE_FROM_WIRE[role];
  }

  static decisionToWire(decision: SubmissionDecision): SubmissionDecisionWire {
    return DECISION_TO_WIRE[decision];
  }

  static decisionFromWire(decision: SubmissionDecisionWire): SubmissionDecision {
    return DECISION_FROM_WIRE[decision];
  }
}
