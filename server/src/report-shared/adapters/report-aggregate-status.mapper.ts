import { ReportDraftAggregateStatus } from '../../generated/prisma/enums';
import type { AggregateStatusWire } from '../models/report-aggregate-status.wire';

/**
 * Pure Prisma-enum ↔ wire translation for the report-draft aggregate status.
 *
 * Shared between the `report-draft` mapper (owns the read model) and the
 * `report-team` mapper (embeds the linked draft status), so neither adapter has
 * to import the other — breaking the historical report-draft ↔ report-team cycle.
 */
export const AGGREGATE_STATUS_TO_WIRE: Record<
  ReportDraftAggregateStatus,
  AggregateStatusWire
> = {
  [ReportDraftAggregateStatus.DRAFT]: 'draft',
  [ReportDraftAggregateStatus.UNDER_REVIEW]: 'under-review',
  [ReportDraftAggregateStatus.UNDER_GLOBAL_REVIEW]: 'under-global-review',
  [ReportDraftAggregateStatus.READY_TO_PROGRAM]: 'ready-to-program',
  [ReportDraftAggregateStatus.SUBMITTED_TO_PROGRAM]: 'submitted-to-program',
  [ReportDraftAggregateStatus.PUBLISHED]: 'published',
  [ReportDraftAggregateStatus.GIVEN_UP]: 'given-up',
  [ReportDraftAggregateStatus.REJECTED]: 'rejected',
};

export const AGGREGATE_STATUS_FROM_WIRE: Record<
  AggregateStatusWire,
  ReportDraftAggregateStatus
> = {
  draft: ReportDraftAggregateStatus.DRAFT,
  'under-review': ReportDraftAggregateStatus.UNDER_REVIEW,
  'under-global-review': ReportDraftAggregateStatus.UNDER_GLOBAL_REVIEW,
  'ready-to-program': ReportDraftAggregateStatus.READY_TO_PROGRAM,
  'submitted-to-program': ReportDraftAggregateStatus.SUBMITTED_TO_PROGRAM,
  published: ReportDraftAggregateStatus.PUBLISHED,
  'given-up': ReportDraftAggregateStatus.GIVEN_UP,
  rejected: ReportDraftAggregateStatus.REJECTED,
};

export function aggregateStatusToWire(
  status: ReportDraftAggregateStatus,
): AggregateStatusWire {
  return AGGREGATE_STATUS_TO_WIRE[status];
}

export function aggregateStatusFromWire(
  status: AggregateStatusWire,
): ReportDraftAggregateStatus {
  return AGGREGATE_STATUS_FROM_WIRE[status];
}
