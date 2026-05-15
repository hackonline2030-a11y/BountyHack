import { DraftStep, ReviewerRole, SubmissionDecision } from '../../../generated/prisma/enums';
import { SubmissionKind } from '../../../generated/prisma/enums';
import {
  SubmissionPrismaMapper,
  type SubmissionWithSnapshots,
} from './submission-prisma.mapper';

describe('SubmissionPrismaMapper', () => {
  it('maps prisma submission to wire JSON', () => {
    const row: SubmissionWithSnapshots = {
      id: 'sub-1',
      reportDraftStepId: 'step-1',
      reportDraftId: 'draft-1',
      step: DraftStep.META,
      round: 1,
      submissionKind: SubmissionKind.HUNTER_TO_REVIEWER,
      payload: { reportTitle: 'XSS' },
      submittedAt: new Date('2026-05-15T12:00:00.000Z'),
      submittedBy: 'hunter-1',
      reviewerRole: ReviewerRole.QUALITY_CHECKER,
      decision: SubmissionDecision.PENDING,
      decidedAt: null,
      decidedBy: null,
      attachmentSnapshots: [],
    };

    const wire = SubmissionPrismaMapper.toDomain(row);
    expect(wire.step).toBe(0);
    expect(wire.reviewerRole).toBe('quality_checker');
    expect(wire.decision).toBe('pending');
    expect(wire.payload).toEqual({ reportTitle: 'XSS' });
  });
});
