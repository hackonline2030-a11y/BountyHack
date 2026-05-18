import type { Prisma } from '../../../generated/prisma/client';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import { buildFrozenContentFromDraft } from './promote-draft-to-report';

/** Builds the JSON snapshot stored on `reports.frozen_content` from a validated draft wire. */
export function frozenContentFromDraft(
  draft: ReportDraftWire,
  frozenAt: Date = new Date(),
): Prisma.InputJsonValue {
  return buildFrozenContentFromDraft(draft, frozenAt) as Prisma.InputJsonValue;
}

export type SyncReportFrozenContentInput = {
  reportId: string;
  draft: ReportDraftWire;
  frozenAt?: Date;
};

export type ReportFrozenContentUpdate = {
  frozenContent: Prisma.InputJsonValue;
  contentSyncedAt: Date;
  updatedAt: Date;
};

export function reportFrozenContentUpdateFromDraft(
  input: SyncReportFrozenContentInput,
): ReportFrozenContentUpdate {
  const frozenAt = input.frozenAt ?? new Date();
  return {
    frozenContent: frozenContentFromDraft(input.draft, frozenAt),
    contentSyncedAt: frozenAt,
    updatedAt: frozenAt,
  };
}
