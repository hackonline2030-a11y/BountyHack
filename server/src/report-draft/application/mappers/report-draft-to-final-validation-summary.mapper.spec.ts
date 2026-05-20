import { toReportDraftFinalValidationSummary } from './report-draft-to-final-validation-summary.mapper';
import type { ReportDraftWire } from '../../models/report-draft-api.types';

function minimalDraft(overrides?: Partial<ReportDraftWire>): ReportDraftWire {
  const emptyStep = {
    payload: {},
    attachments: [],
    status: 'approved' as const,
    currentRound: 1,
    assignedReviewerRole: 'quality_checker' as const,
  };
  return {
    id: 'draft-1',
    hunterId: 'hunter-1',
    hunterWriterId: 'hunter-1',
    version: 3,
    aggregateStatus: 'ready-to-program',
    meta: {
      ...emptyStep,
      payload: { reportTitle: '  My report  ' },
    },
    description: emptyStep,
    collection: emptyStep,
    exploitation: emptyStep,
    proofOfConcept: emptyStep,
    risks: emptyStep,
    remediation: emptyStep,
    final: emptyStep,
    createdAt: '2026-05-15T10:00:00.000Z',
    updatedAt: '2026-05-16T12:00:00.000Z',
    reportTeam: {
      label: 'Equipe Alpha',
      members: [],
    },
    ...overrides,
  };
}

describe('toReportDraftFinalValidationSummary', () => {
  it('maps title, team label, and per-step statuses', () => {
    const summary = toReportDraftFinalValidationSummary(minimalDraft());
    expect(summary).toEqual({
      id: 'draft-1',
      hunterId: 'hunter-1',
      aggregateStatus: 'ready-to-program',
      reportTitle: 'My report',
      teamLabel: 'Equipe Alpha',
      stepStatuses: {
        meta: 'approved',
        description: 'approved',
        collection: 'approved',
        exploitation: 'approved',
        proofOfConcept: 'approved',
        risks: 'approved',
        remediation: 'approved',
        final: 'approved',
      },
      createdAt: '2026-05-15T10:00:00.000Z',
      updatedAt: '2026-05-16T12:00:00.000Z',
    });
  });

  it('falls back to empty title and null team label', () => {
    const summary = toReportDraftFinalValidationSummary(
      minimalDraft({ reportTeam: null, meta: { ...minimalDraft().meta, payload: {} } }),
    );
    expect(summary.reportTitle).toBe('');
    expect(summary.teamLabel).toBeNull();
  });
});
