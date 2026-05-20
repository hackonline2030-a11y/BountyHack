import type {
  ReportDraftStepStateKeyWire,
  ReportDraftWire,
  SubmissionStepWire,
  SubmissionWire,
} from '../models/report-draft-api.types';

const STEP_STATE_KEYS: ReadonlyArray<ReportDraftStepStateKeyWire> = [
  'meta',
  'description',
  'collection',
  'exploitation',
  'proofOfConcept',
  'risks',
  'remediation',
  'final',
];

const STEP_NUMBER_TO_STATE_KEY: Record<SubmissionStepWire, ReportDraftStepStateKeyWire> =
  {
    0: 'meta',
    1: 'description',
    2: 'collection',
    3: 'exploitation',
    4: 'proofOfConcept',
    5: 'risks',
    6: 'remediation',
    7: 'final',
  };

function allStepsApproved(draft: ReportDraftWire): boolean {
  return STEP_STATE_KEYS.every((key) => draft[key].status === 'approved');
}

/**
 * Primary workflow path: when a reviewer finalizes a submission, mirror the step
 * transition onto the report draft. Required because only the designated hunter
 * writer may PUT the draft — QC/mentor actions go through submission save instead.
 */
export function applySubmissionDecisionToDraft(
  draft: ReportDraftWire,
  submission: SubmissionWire,
): ReportDraftWire | null {
  if (submission.decision === 'pending') {
    return null;
  }

  const stepKey = STEP_NUMBER_TO_STATE_KEY[submission.step];
  const stepState = draft[stepKey];
  const now = new Date().toISOString();

  switch (submission.decision) {
    case 'approve': {
      if (
        submission.reviewerRole !== 'quality_checker' &&
        submission.reviewerRole !== 'super_admin'
      ) {
        return null;
      }
      const next: ReportDraftWire = {
        ...draft,
        [stepKey]: { ...stepState, status: 'approved' },
        updatedAt: now,
        version: draft.version + 1,
      };
      if (allStepsApproved(next)) {
        next.aggregateStatus = 'ready-to-program';
      }
      return next;
    }
    case 'request-changes': {
      return {
        ...draft,
        [stepKey]: { ...stepState, status: 'needs-revision' },
        updatedAt: now,
        version: draft.version + 1,
      };
    }
    case 'endorse': {
      if (submission.reviewerRole !== 'mentor') {
        return null;
      }
      return {
        ...draft,
        [stepKey]: {
          ...stepState,
          status: 'in-progress',
          assignedReviewerRole: null,
        },
        updatedAt: now,
        version: draft.version + 1,
      };
    }
    default:
      return null;
  }
}

function latestFinalizedSubmissionForStep(
  submissions: SubmissionWire[],
  step: SubmissionStepWire,
): SubmissionWire | null {
  const forStep = submissions.filter(
    (s) => s.step === step && s.decision !== 'pending',
  );
  if (forStep.length === 0) return null;
  return forStep.reduce((best, current) =>
    current.round >= best.round ? current : best,
  );
}

/**
 * Idempotent read-time repair: fixes draft rows that still disagree with finalized
 * submissions (legacy data from before submission-save sync, or a rare failed draft
 * write after submission save). No-op when the draft is already in sync.
 */
export function repairDraftWorkflowDriftFromSubmissions(
  draft: ReportDraftWire,
  submissions: SubmissionWire[],
): ReportDraftWire {
  const forDraft = submissions.filter((s) => s.reportDraftId === draft.id);
  let next = draft;

  for (const step of Object.keys(STEP_NUMBER_TO_STATE_KEY).map(
    Number,
  ) as SubmissionStepWire[]) {
    const latest = latestFinalizedSubmissionForStep(forDraft, step);
    if (latest === null) continue;
    const applied = applySubmissionDecisionToDraft(next, latest);
    if (applied !== null) {
      next = applied;
    }
  }

  return next;
}

export function reportDraftWorkflowChanged(
  before: ReportDraftWire,
  after: ReportDraftWire,
): boolean {
  if (before.version !== after.version || before.aggregateStatus !== after.aggregateStatus) {
    return true;
  }
  return STEP_STATE_KEYS.some((key) => before[key].status !== after[key].status);
}
