import type { ReportDraftOrphanSummary } from '../models/report-draft-orphan-summary.model';
import type { ReportDraftWire } from '../models/report-draft-api.types';

export interface IReportDraftRepository {
  save(draft: ReportDraftWire): Promise<void>;
  findById(id: string): Promise<ReportDraftWire | null>;
  findByHunterId(hunterId: string): Promise<ReportDraftWire[]>;
  /** All drafts (newest first) — super-admin validation queue. */
  findAll(): Promise<ReportDraftWire[]>;
  /** Drafts with no report team (newest first), including hunter display name. */
  findOrphanSummaries(): Promise<ReportDraftOrphanSummary[]>;
  /** Super-admin validated drafts (newest first) — PDF/dashboard source of truth. */
  findPublished(): Promise<ReportDraftWire[]>;
  /** Hard delete draft and all dependent rows (see DeleteReportDraftCommand). */
  deleteById(id: string): Promise<void>;
}

export const I_REPORT_DRAFT_REPOSITORY = Symbol('I_REPORT_DRAFT_REPOSITORY');
