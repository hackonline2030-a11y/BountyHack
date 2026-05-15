import { ForbiddenException } from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import { SaveReportDraftCommand } from './save-report-draft.command';
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

describe('SaveReportDraftCommand', () => {
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
  const access = new ReportDraftAccessPolicy(
    reportDraftRepository,
    submissionRepository,
  );
  const command = new SaveReportDraftCommand(reportDraftRepository, access);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists when hunterId matches identity', async () => {
    await command.execute(
      { uid: 'hunter-1', email: 'h@example.com' },
      minimalDraft(),
    );
    expect(reportDraftRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'draft-1' }),
    );
  });

  it('allows quality checker to persist hunter draft after review', async () => {
    await command.execute(
      {
        uid: 'qc-1',
        email: 'qc@example.com',
        roleCode: AppRoleCode.QUALITY_CHECKER,
      },
      minimalDraft({
        meta: {
          payload: {},
          attachments: [],
          status: 'needs-revision',
          currentRound: 1,
          assignedReviewerRole: 'quality_checker',
        },
      }),
    );
    expect(reportDraftRepository.save).toHaveBeenCalled();
  });

  it('rejects unrelated user', async () => {
    await expect(
      command.execute(
        { uid: 'other-hunter', email: 'o@example.com' },
        minimalDraft(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(reportDraftRepository.save).not.toHaveBeenCalled();
  });
});
