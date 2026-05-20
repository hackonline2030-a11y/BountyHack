import { ListReportDraftsForFinalValidationQuery } from './list-report-drafts-for-final-validation.query';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftWire } from '../../models/report-draft-api.types';

describe('ListReportDraftsForFinalValidationQuery', () => {
  const repository: jest.Mocked<IReportDraftRepository> = {
    save: jest.fn(),
    updateHunterWriterId: jest.fn(),
    findById: jest.fn(),
    findByHunterId: jest.fn(),
    findByHunterIdOrTeamMembership: jest.fn(),
    findAll: jest.fn(),
    findOrphanSummaries: jest.fn(),
    findPublished: jest.fn(),
    deleteById: jest.fn(),
  };

  const query = new ListReportDraftsForFinalValidationQuery(repository);

  it('loads all drafts and maps summaries', async () => {
    const emptyStep = {
      payload: { reportTitle: 'R1' },
      attachments: [],
      status: 'approved' as const,
      currentRound: 1,
      assignedReviewerRole: null,
    };
    const draft: ReportDraftWire = {
      id: 'd1',
      hunterId: 'h1',
      hunterWriterId: 'h1',
      version: 1,
      aggregateStatus: 'ready-to-program',
      meta: emptyStep,
      description: emptyStep,
      collection: emptyStep,
      exploitation: emptyStep,
      proofOfConcept: emptyStep,
      risks: emptyStep,
      remediation: emptyStep,
      final: emptyStep,
      createdAt: '2026-05-15T10:00:00.000Z',
      updatedAt: '2026-05-15T11:00:00.000Z',
    };
    repository.findAll.mockResolvedValue([draft]);

    const rows = await query.execute();

    expect(repository.findAll).toHaveBeenCalled();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'd1',
      reportTitle: 'R1',
      aggregateStatus: 'ready-to-program',
    });
  });
});
