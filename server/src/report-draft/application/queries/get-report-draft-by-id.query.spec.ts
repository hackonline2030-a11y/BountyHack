import { ForbiddenException } from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import { GetReportDraftByIdQuery } from './get-report-draft-by-id.query';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import type { ReportDraftWire } from '../../models/report-draft-api.types';

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

describe('GetReportDraftByIdQuery', () => {
  const repository: jest.Mocked<IReportDraftRepository> = {
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
  const access = new ReportDraftAccessPolicy(repository, submissionRepository);
  const query = new GetReportDraftByIdQuery(repository, access);

  it('allows hunter owner', async () => {
    repository.findById.mockResolvedValue(minimalDraft());
    await expect(
      query.execute({ uid: 'hunter-1', email: 'h@example.com' }, 'draft-1'),
    ).resolves.toEqual(expect.objectContaining({ id: 'draft-1' }));
  });

  it('allows quality checker to read hunter draft', async () => {
    repository.findById.mockResolvedValue(minimalDraft());
    await expect(
      query.execute(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        'draft-1',
      ),
    ).resolves.toEqual(expect.objectContaining({ hunterId: 'hunter-1' }));
  });

  it('rejects unrelated user', async () => {
    repository.findById.mockResolvedValue(minimalDraft());
    await expect(
      query.execute({ uid: 'other', email: 'o@example.com' }, 'draft-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
