import { DraftStep, ReportDraftAggregateStatus, StepStatus } from '../../../generated/prisma/enums';
import { ReportDraftPrismaMapper, type ReportDraftWithSteps } from './report-draft-prisma.mapper';
import type { ReportDraftWire } from '../../models/report-draft-api.types';

function buildPrismaRow(overrides?: Partial<ReportDraftWithSteps>): ReportDraftWithSteps {
  const base: ReportDraftWithSteps = {
    id: 'draft-1',
    hunterId: 'hunter-1',
    hunterWriterId: 'hunter-1',
    version: 2,
    aggregateStatus: ReportDraftAggregateStatus.UNDER_REVIEW,
    superAdminRevisionRequestedAt: null,
    superAdminGlobalRevisionCount: 0,
    createdAt: new Date('2026-05-15T10:00:00.000Z'),
    updatedAt: new Date('2026-05-15T11:00:00.000Z'),
    steps: [
      {
        id: 'step-meta',
        reportDraftId: 'draft-1',
        step: DraftStep.META,
        payload: { reportTitle: 'SQLi' },
        status: StepStatus.AWAITING_REVIEW,
        currentRound: 1,
        assignedReviewerRole: null,
        createdAt: new Date('2026-05-15T10:00:00.000Z'),
        updatedAt: new Date('2026-05-15T11:00:00.000Z'),
        attachments: [
          {
            id: 'att-1',
            reportDraftStepId: 'step-meta',
            filename: 'shot.png',
            mimeType: 'image/png',
            sizeBytes: 1024,
            storageKey: 'keys/shot.png',
            thumbnailUrl: null,
            uploadedBy: 'hunter-1',
            uploadedAt: new Date('2026-05-15T10:05:00.000Z'),
          },
        ],
      },
    ],
  };
  return { ...base, ...overrides };
}

function buildWireDraft(overrides?: Partial<ReportDraftWire>): ReportDraftWire {
  const base: ReportDraftWire = {
    id: 'draft-1',
    hunterId: 'hunter-1',
    hunterWriterId: 'hunter-1',
    version: 2,
    aggregateStatus: 'under-review',
    meta: {
      payload: { reportTitle: 'XSS' },
      attachments: [],
      status: 'in-progress',
      currentRound: 0,
      assignedReviewerRole: null,
    },
    description: emptyStep(),
    collection: emptyStep(),
    exploitation: emptyStep(),
    proofOfConcept: emptyStep(),
    risks: emptyStep(),
    remediation: emptyStep(),
    final: emptyStep(),
    createdAt: '2026-05-15T10:00:00.000Z',
    updatedAt: '2026-05-15T11:00:00.000Z',
  };
  return { ...base, ...overrides };
}

function emptyStep() {
  return {
    payload: {},
    attachments: [],
    status: 'in-progress' as const,
    currentRound: 0,
    assignedReviewerRole: null,
  };
}

describe('ReportDraftPrismaMapper', () => {
  it('maps prisma row to client wire JSON', () => {
    const domain = ReportDraftPrismaMapper.toDomain(buildPrismaRow());

    expect(domain.id).toBe('draft-1');
    expect(domain.hunterId).toBe('hunter-1');
    expect(domain.hunterWriterId).toBe('hunter-1');
    expect(domain.version).toBe(2);
    expect(domain.aggregateStatus).toBe('under-review');
    expect(domain.meta.payload).toEqual({ reportTitle: 'SQLi' });
    expect(domain.meta.status).toBe('awaiting-review');
    expect(domain.meta.currentRound).toBe(1);
    expect(domain.meta.attachments).toHaveLength(1);
    expect(domain.meta.attachments[0].filename).toBe('shot.png');
    expect(domain.description.status).toBe('in-progress');
    expect(domain.createdAt).toBe('2026-05-15T10:00:00.000Z');
  });

  it('maps aggregate status ready-to-program round-trip', () => {
    const wire = buildWireDraft({ aggregateStatus: 'ready-to-program' });
    const header = ReportDraftPrismaMapper.draftHeaderFromWire(wire);
    expect(header.aggregateStatus).toBe(ReportDraftAggregateStatus.READY_TO_PROGRAM);
  });

  it('maps all eight steps from wire to prisma step inputs', () => {
    const wire = buildWireDraft({
      meta: {
        ...emptyStep(),
        payload: { reportTitle: 'A' },
        status: 'approved',
        currentRound: 2,
        assignedReviewerRole: 'quality_checker',
      },
    });

    const steps = ReportDraftPrismaMapper.stepRowsFromWire(wire);
    expect(steps).toHaveLength(8);
    expect(steps[0]).toMatchObject({
      step: DraftStep.META,
      status: StepStatus.APPROVED,
      currentRound: 2,
    });
    expect(steps[7].step).toBe(DraftStep.FINAL);
  });
});
