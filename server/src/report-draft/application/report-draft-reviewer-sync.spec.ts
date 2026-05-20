import {
  applySubmissionDecisionToDraft,
  repairDraftWorkflowDriftFromSubmissions,
} from './report-draft-reviewer-sync';
import type { ReportDraftWire, SubmissionWire } from '../models/report-draft-api.types';

function emptyStep() {
  return {
    payload: {},
    attachments: [],
    status: 'awaiting-review' as const,
    currentRound: 0,
    assignedReviewerRole: 'quality_checker' as const,
  };
}

function minimalDraft(overrides?: Partial<ReportDraftWire>): ReportDraftWire {
  const empty = emptyStep();
  return {
    id: 'draft-1',
    hunterId: 'hunter-1',
    hunterWriterId: 'hunter-writer',
    version: 1,
    aggregateStatus: 'under-review',
    meta: empty,
    description: { ...empty, status: 'in-progress' },
    collection: { ...empty, status: 'in-progress' },
    exploitation: { ...empty, status: 'in-progress' },
    proofOfConcept: { ...empty, status: 'in-progress' },
    risks: { ...empty, status: 'in-progress' },
    remediation: { ...empty, status: 'in-progress' },
    final: { ...empty, status: 'in-progress' },
    createdAt: '2026-05-15T10:00:00.000Z',
    updatedAt: '2026-05-15T10:00:00.000Z',
    ...overrides,
  };
}

function submission(
  overrides: Partial<SubmissionWire> & Pick<SubmissionWire, 'decision'>,
): SubmissionWire {
  return {
    id: 'sub-1',
    reportDraftId: 'draft-1',
    step: 0,
    round: 0,
    reviewerRole: 'quality_checker',
    submittedBy: 'hunter-writer',
    payload: {},
    attachmentsSnapshot: [],
    decision: overrides.decision,
    submittedAt: '2026-05-15T11:00:00.000Z',
    decidedAt: '2026-05-15T12:00:00.000Z',
    decidedBy: 'qc-1',
    ...overrides,
  };
}

describe('applySubmissionDecisionToDraft', () => {
  it('sets meta to approved when QC approves step 0', () => {
    const draft = minimalDraft();
    const next = applySubmissionDecisionToDraft(
      draft,
      submission({ decision: 'approve' }),
    );
    expect(next?.meta.status).toBe('approved');
    expect(next?.version).toBe(2);
  });

  it('promotes aggregate to ready-to-program when every step is approved', () => {
    const approved = { ...emptyStep(), status: 'approved' as const };
    const draft = minimalDraft({
      meta: approved,
      description: approved,
      collection: approved,
      exploitation: approved,
      proofOfConcept: approved,
      risks: approved,
      remediation: approved,
      final: emptyStep(),
    });
    const next = applySubmissionDecisionToDraft(
      draft,
      submission({ decision: 'approve', step: 7 }),
    );
    expect(next?.final.status).toBe('approved');
    expect(next?.aggregateStatus).toBe('ready-to-program');
  });

  it('sets needs-revision on request-changes', () => {
    const draft = minimalDraft();
    const next = applySubmissionDecisionToDraft(
      draft,
      submission({ decision: 'request-changes' }),
    );
    expect(next?.meta.status).toBe('needs-revision');
  });

  it('returns null for pending submissions', () => {
    expect(
      applySubmissionDecisionToDraft(
        minimalDraft(),
        submission({ decision: 'pending', decidedAt: undefined, decidedBy: undefined }),
      ),
    ).toBeNull();
  });

  it('repairDraftWorkflowDriftFromSubmissions repairs awaiting-review when submission is approved', () => {
    const draft = minimalDraft();
    const repaired = repairDraftWorkflowDriftFromSubmissions(draft, [
      submission({ decision: 'approve' }),
    ]);
    expect(repaired.meta.status).toBe('approved');
  });
});
