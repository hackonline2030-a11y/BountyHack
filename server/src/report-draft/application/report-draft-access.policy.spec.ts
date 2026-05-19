import { ForbiddenException } from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import { ReportDraftAccessPolicy } from './report-draft-access.policy';
import type { IReportDraftRepository } from '../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../ports/submission-repository.interface';
import type { IReportTeamRepository } from '../../report-team/ports/report-team-repository.interface';
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
    findAll: jest.fn(),
    findOrphanSummaries: jest.fn(),
  };
  const submissionRepository: jest.Mocked<ISubmissionRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByDraftId: jest.fn(),
    findPendingForReviewerRole: jest.fn(),
    findPendingForReviewerRoleInDrafts: jest.fn(),
    findAllForReviewerRole: jest.fn(),
    findAllForReviewerRoleInDrafts: jest.fn(),
    findMentorSubmissionsForDraftIds: jest.fn(),
  };

  const reportTeamRepository: jest.Mocked<
    Pick<
      IReportTeamRepository,
      | 'isMemberOfDraft'
      | 'findDraftIdsForMember'
      | 'findByReportDraftId'
    >
  > = {
    isMemberOfDraft: jest.fn().mockResolvedValue(false),
    findDraftIdsForMember: jest.fn().mockResolvedValue([]),
    findByReportDraftId: jest.fn().mockResolvedValue(null),
  };

  const policy = new ReportDraftAccessPolicy(
    reportDraftRepository,
    submissionRepository,
    reportTeamRepository as unknown as IReportTeamRepository,
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

  it('allows hunter owner on orphan draft without team row', async () => {
    reportTeamRepository.findDraftIdsForMember.mockResolvedValue([]);
    reportTeamRepository.findByReportDraftId.mockResolvedValue(null);
    await expect(
      policy.assertCanReadDraft(
        {
          uid: 'hunter-1',
          email: 'h@example.com',
          roleCode: AppRoleCode.HUNTER,
        },
        { id: 'draft-1', hunterId: 'hunter-1' },
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects hunter owner when a team exists but they are not a member', async () => {
    reportTeamRepository.findDraftIdsForMember.mockResolvedValue(['draft-1']);
    reportTeamRepository.isMemberOfDraft.mockResolvedValue(false);
    reportTeamRepository.findByReportDraftId.mockResolvedValue({
      id: 'team-1',
      reportDraftId: 'draft-1',
      label: 'Team',
      members: [],
      validity: 'valid',
      draftAggregateStatus: 'draft',
      updatedAt: '2026-05-15T10:00:00.000Z',
    });
    await expect(
      policy.assertCanReadDraft(
        {
          uid: 'hunter-1',
          email: 'h@example.com',
          roleCode: AppRoleCode.HUNTER,
        },
        { id: 'draft-1', hunterId: 'hunter-1' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows co-hunter on team to read primary hunter draft', async () => {
    reportTeamRepository.findDraftIdsForMember.mockResolvedValue(['draft-1']);
    reportTeamRepository.isMemberOfDraft.mockResolvedValue(true);
    await expect(
      policy.assertCanReadDraft(
        {
          uid: 'hunter-2',
          email: 'h2@example.com',
          roleCode: AppRoleCode.HUNTER,
        },
        { id: 'draft-1', hunterId: 'hunter-1' },
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects hunter without any team from reading another hunters draft', async () => {
    reportTeamRepository.findDraftIdsForMember.mockResolvedValue([]);
    reportTeamRepository.isMemberOfDraft.mockResolvedValue(false);
    reportTeamRepository.findByReportDraftId.mockResolvedValue(null);
    await expect(
      policy.assertCanReadDraft(
        {
          uid: 'hunter-solo',
          email: 'solo@example.com',
          roleCode: AppRoleCode.HUNTER,
        },
        { id: 'draft-other', hunterId: 'hunter-1' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows hunter without any team to read own draft only', async () => {
    reportTeamRepository.findDraftIdsForMember.mockResolvedValue([]);
    await expect(
      policy.assertCanReadDraft(
        {
          uid: 'hunter-solo',
          email: 'solo@example.com',
          roleCode: AppRoleCode.HUNTER,
        },
        { id: 'draft-solo', hunterId: 'hunter-solo' },
      ),
    ).resolves.toBeUndefined();
    expect(reportTeamRepository.isMemberOfDraft).not.toHaveBeenCalled();
  });

  it('allows quality checker on team to save hunter draft', async () => {
    reportTeamRepository.isMemberOfDraft.mockResolvedValue(true);
    await expect(
      policy.assertCanSaveDraft(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        { id: 'draft-1', hunterId: 'hunter-1' },
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects quality checker not on team from reading draft', async () => {
    reportTeamRepository.isMemberOfDraft.mockResolvedValue(false);
    await expect(
      policy.assertCanReadDraft(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        { id: 'draft-1', hunterId: 'hunter-1' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects quality checker not on team from saving draft', async () => {
    reportTeamRepository.isMemberOfDraft.mockResolvedValue(false);
    await expect(
      policy.assertCanSaveDraft(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        { id: 'draft-1', hunterId: 'hunter-1' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows quality checker to save comments on assigned submission', async () => {
    reportDraftRepository.findById.mockResolvedValue(minimalDraft());
    reportTeamRepository.isMemberOfDraft.mockResolvedValue(true);
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

  it('allows quality checker on team to save submission decision', async () => {
    reportDraftRepository.findById.mockResolvedValue(minimalDraft());
    reportTeamRepository.isMemberOfDraft.mockResolvedValue(true);
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

  it('allows super admin to read another hunters draft', async () => {
    await expect(
      policy.assertCanReadDraft(
        {
          uid: 'admin-1',
          email: 'admin@example.com',
          roleCode: AppRoleCode.SUPER_ADMIN,
        },
        { id: 'draft-1', hunterId: 'hunter-1' },
      ),
    ).resolves.toBeUndefined();
  });

  it('allows super admin to read submissions on another hunters draft', async () => {
    reportDraftRepository.findById.mockResolvedValue(minimalDraft());
    await expect(
      policy.assertCanReadSubmission(
        {
          uid: 'admin-1',
          email: 'admin@example.com',
          roleCode: AppRoleCode.SUPER_ADMIN,
        },
        minimalSubmission(),
      ),
    ).resolves.toBeUndefined();
  });
});
