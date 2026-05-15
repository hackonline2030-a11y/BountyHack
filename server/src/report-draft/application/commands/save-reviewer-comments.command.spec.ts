import { ForbiddenException } from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import { SaveReviewerCommentsCommand } from './save-reviewer-comments.command';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';
import type { IReviewerCommentRepository } from '../../ports/reviewer-comment-repository.interface';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import type { ReviewerCommentWire } from '../../models/report-draft-api.types';

function comment(overrides?: Partial<ReviewerCommentWire>): ReviewerCommentWire {
  return {
    id: 'comment-1',
    submissionId: 'sub-1',
    authorId: 'qc-1',
    authorRole: 'quality_checker',
    body: 'Please clarify scope',
    createdAt: '2026-05-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('SaveReviewerCommentsCommand', () => {
  const repository: jest.Mocked<IReviewerCommentRepository> = {
    saveMany: jest.fn(),
    findBySubmissionId: jest.fn(),
  };
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
  const command = new SaveReviewerCommentsCommand(repository, access);

  beforeEach(() => {
    jest.clearAllMocks();
    submissionRepository.findById.mockResolvedValue({
      id: 'sub-1',
      reportDraftId: 'draft-1',
      step: 0,
      round: 1,
      payload: {},
      attachmentsSnapshot: [],
      submittedAt: '2026-05-15T11:00:00.000Z',
      submittedBy: 'hunter-1',
      reviewerRole: 'quality_checker',
      decision: 'pending',
    });
  });

  it('persists comments when QC author matches identity', async () => {
    await command.execute(
      {
        uid: 'qc-1',
        email: 'qc@example.com',
        roleCode: AppRoleCode.QUALITY_CHECKER,
      },
      [comment()],
    );
    expect(repository.saveMany).toHaveBeenCalledWith([comment()]);
  });

  it('rejects when authorId does not match identity', async () => {
    await expect(
      command.execute(
        {
          uid: 'qc-1',
          email: 'qc@example.com',
          roleCode: AppRoleCode.QUALITY_CHECKER,
        },
        [comment({ authorId: 'other-qc' })],
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.saveMany).not.toHaveBeenCalled();
  });

  it('rejects hunter saving reviewer comments', async () => {
    await expect(
      command.execute(
        { uid: 'hunter-1', email: 'h@example.com', roleCode: AppRoleCode.HUNTER },
        [comment({ authorId: 'hunter-1', authorRole: 'hunter' })],
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.saveMany).not.toHaveBeenCalled();
  });
});
