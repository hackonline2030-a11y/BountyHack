import { ListOrphanReportDraftsQuery } from './list-orphan-report-drafts.query';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';

describe('ListOrphanReportDraftsQuery', () => {
  it('returns orphan summaries from the repository', async () => {
    const summaries = [
      {
        id: 'draft-1',
        hunterId: 'hunter-1',
        hunterDisplayName: 'Alice',
        aggregateStatus: 'draft' as const,
        reportTitle: 'Test',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ];
    const repository: jest.Mocked<Pick<IReportDraftRepository, 'findOrphanSummaries'>> = {
      findOrphanSummaries: jest.fn().mockResolvedValue(summaries),
    };
    const query = new ListOrphanReportDraftsQuery(
      repository as unknown as IReportDraftRepository,
    );

    await expect(query.execute()).resolves.toEqual(summaries);
    expect(repository.findOrphanSummaries).toHaveBeenCalled();
  });
});
