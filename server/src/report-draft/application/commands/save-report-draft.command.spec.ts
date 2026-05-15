import { ForbiddenException } from '@nestjs/common';
import { SaveReportDraftCommand } from './save-report-draft.command';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
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
  const repository: jest.Mocked<IReportDraftRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByHunterId: jest.fn(),
  };

  const command = new SaveReportDraftCommand(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists when hunterId matches identity', async () => {
    await command.execute(
      { uid: 'hunter-1', email: 'h@example.com' },
      minimalDraft(),
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'draft-1' }),
    );
  });

  it('rejects when hunterId does not match identity', async () => {
    await expect(
      command.execute(
        { uid: 'other-hunter', email: 'o@example.com' },
        minimalDraft(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
