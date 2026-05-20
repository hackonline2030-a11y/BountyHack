import { randomUUID } from 'node:crypto';
import type { ReportDraftWire, StepStateWire } from '../models/report-draft-api.types';

function emptyStep(): StepStateWire {
  return {
    payload: {},
    attachments: [],
    status: 'in-progress',
    currentRound: 0,
    assignedReviewerRole: null,
  };
}

export function createEmptyReportDraftWire(input: {
  hunterId: string;
  id?: string;
  now?: string;
}): ReportDraftWire {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? randomUUID(),
    hunterId: input.hunterId,
    hunterWriterId: input.hunterId,
    version: 0,
    aggregateStatus: 'draft',
    meta: emptyStep(),
    description: emptyStep(),
    collection: emptyStep(),
    exploitation: emptyStep(),
    proofOfConcept: emptyStep(),
    risks: emptyStep(),
    remediation: emptyStep(),
    final: emptyStep(),
    createdAt: now,
    updatedAt: now,
  };
}
