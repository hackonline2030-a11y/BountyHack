import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import { ListSubmissionsQuery } from './list-submissions.query';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import type { IReportTeamRepository } from '../../../report-team/ports/report-team-repository.interface';
import type { ReportDraftWire, SubmissionWire } from '../../models/report-draft-api.types';

function minimalDraft(): ReportDraftWire {
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
  };
}

describe('ListSubmissionsQuery', () => {
  const submissionRepository: jest.Mocked<ISubmissionRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByDraftId: jest.fn(),
    findPendingForReviewerRole: jest.fn(),
    findAllForReviewerRole: jest.fn(),
    findMentorSubmissionsForDraftIds: jest.fn(),
  };
  const reportDraftRepository: jest.Mocked<IReportDraftRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByHunterId: jest.fn(),
    findAll: jest.fn(),
    findOrphanSummaries: jest.fn(),
  };
  const reportTeamRepository: jest.Mocked<
    Pick<IReportTeamRepository, 'isMemberOfDraft' | 'findDraftIdsForMember'>
  > = {
    isMemberOfDraft: jest.fn().mockResolvedValue(false),
    findDraftIdsForMember: jest.fn().mockResolvedValue([]),
  };

  const access = new ReportDraftAccessPolicy(
    reportDraftRepository,
    submissionRepository,
    reportTeamRepository as unknown as IReportTeamRepository,
  );

  const query = new ListSubmissionsQuery(
    submissionRepository,
    reportDraftRepository,
    access,
    reportTeamRepository as unknown as IReportTeamRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists submissions by draftId for super admin on another hunters draft', async () => {
    const submissions: SubmissionWire[] = [
      {
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
      },
    ];
    reportDraftRepository.findById.mockResolvedValue(minimalDraft());
    submissionRepository.findByDraftId.mockResolvedValue(submissions);

    const result = await query.execute(
      {
        uid: 'admin-1',
        email: 'admin@example.com',
        roleCode: AppRoleCode.SUPER_ADMIN,
      },
      { kind: 'draftId', draftId: 'draft-1' },
    );

    expect(result).toEqual(submissions);
    expect(submissionRepository.findByDraftId).toHaveBeenCalledWith('draft-1');
  });
});
