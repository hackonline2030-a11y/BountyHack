import { buildFrozenContentFromDraft } from './promote-draft-to-report';
import type { ReportDraftWire } from '../../models/report-draft-api.types';

function minimalDraft(overrides?: Partial<ReportDraftWire>): ReportDraftWire {
  const emptyStep = {
    payload: {},
    attachments: [],
    status: 'approved' as const,
    currentRound: 1,
    assignedReviewerRole: null,
  };
  return {
    id: 'draft-1',
    hunterId: 'hunter-1',
    version: 2,
    aggregateStatus: 'ready-to-program',
    meta: { ...emptyStep, payload: { reportTitle: 'XSS' } },
    description: emptyStep,
    collection: emptyStep,
    exploitation: emptyStep,
    proofOfConcept: emptyStep,
    risks: emptyStep,
    remediation: emptyStep,
    final: emptyStep,
    createdAt: '2026-05-15T10:00:00.000Z',
    updatedAt: '2026-05-15T11:00:00.000Z',
    ...overrides,
  };
}

describe('buildFrozenContentFromDraft', () => {
  it('snapshots all wizard steps and team metadata', () => {
    const frozenAt = new Date('2026-05-16T12:00:00.000Z');
    const draft = minimalDraft({
      reportTeam: { label: 'Alpha', members: [] },
    });

    const content = buildFrozenContentFromDraft(draft, frozenAt);

    expect(content.schemaVersion).toBe(1);
    expect(content.sourceDraftId).toBe('draft-1');
    expect(content.draftVersion).toBe(2);
    expect(content.hunterId).toBe('hunter-1');
    expect(content.frozenAt).toBe('2026-05-16T12:00:00.000Z');
    expect((content.steps as Record<string, unknown>).meta).toEqual(
      expect.objectContaining({ payload: { reportTitle: 'XSS' } }),
    );
    expect(content.reportTeam).toEqual({ label: 'Alpha', members: [] });
  });
});
