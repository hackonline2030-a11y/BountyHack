import { ForbiddenException } from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import { ReportDraftAccessPolicy } from './report-draft-access.policy';
import type { IReportDraftRepository } from '../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../ports/submission-repository.interface';
import type { ReportDraftWire, SubmissionWire } from '../models/report-draft-api.types';

function minimalDraft(overrides?: Partial<ReportDraftWire>): ReportDraftWire {
  const emptyStep = {
    payload: {},
    attachments: [],
    status: 'in-progress' as const,
    currentRound: 0,
    assignedReviewerRole: null,
  };
  return {
    id: 'draft-1',
    hunterId: 'hunter-1',
    version: 0,
    aggregateStatus: 'draft',
    meta: emptyStep,
    description: emptyStep,
    collection: emptyStep,
    exploitation: emptyStep,
    proofOfConcept: emptyStep,
    risks: emptyStep,
    remediation: emptyStep,
    final: emptyStep,
    createdAt: '2026-05-15T10:00:00.000Z',
    updatedAt: '2026-05-15T10:00:00.000Z',
    ...overrides,
  };
}

function minimalSubmission(overrides?: Partial<SubmissionWire>): SubmissionWire {
  return {
    id: 'sub-1',
    reportDraftId: 'draft-1',
    step: 0,
    round: 1,
    payload: {},
    attachmentsSnapshot: [],
    submittedAt: '2026-05-15T12:00:00.000Z',
    submittedBy: 'hunter-1',
    reviewerRole: 'quality_checker',
    decision: 'pending',
    ...overrides,
  };
}

describe('ReportDraftAccessPolicy', () => {
  const reportDraftRepository: jest.Mocked<IReportDraftRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByHunterId: jest.fn(),
  };
  const submissionRepository: jest.Mocked<ISubmissionRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByDraftId: jest.fn(),
    findPendingForReviewerRole: jest.fn(),
    findAllForReviewerRole: jest.fn(),
  };

  const policy = new ReportDraftAccessPolicy(
    reportDraftRepository,
    submissionRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows hunter to save pending submission on own draft', async () => {
    reportDraftRepository.findById.mockResolvedValue(minimalDraft());
    await expect(
      policy.assertCanSaveSubmission(
        { uid: 'hunter-1', email: 'h@example.com' },
        minimalSubmission(),
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects hunter saving submission on another hunters draft', async () => {
    reportDraftRepository.findById.mockResolvedValue(
      minimalDraft({ hunterId: 'other' }),
    );
    await expect(
      policy.assertCanSaveSubmission(
        { uid: 'hunter-1', email: 'h@example.com' },
        minimalSubmission(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows quality checker to list QC submissions', () => {
    expect(() =>
      policy.assertCanQueryReviewerRole(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        'quality_checker',
      ),
    ).not.toThrow();
  });

  it('allows quality checker to save hunter draft for review workflow', () => {
    expect(() =>
      policy.assertCanSaveDraft(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        { hunterId: 'hunter-1' },
      ),
    ).not.toThrow();
  });

  it('allows quality checker to save comments on assigned submission', async () => {
    submissionRepository.findById.mockResolvedValue(minimalSubmission());
    await expect(
      policy.assertCanSaveComments(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        'sub-1',
        ['qc-1'],
      ),
    ).resolves.toBeUndefined();
  });

  it('allows quality checker to save submission decision', async () => {
    reportDraftRepository.findById.mockResolvedValue(minimalDraft());
    await expect(
      policy.assertCanSaveSubmission(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        minimalSubmission({
          decision: 'request-changes',
          decidedBy: 'qc-1',
          decidedAt: '2026-05-15T13:00:00.000Z',
        }),
      ),
    ).resolves.toBeUndefined();
  });
});
