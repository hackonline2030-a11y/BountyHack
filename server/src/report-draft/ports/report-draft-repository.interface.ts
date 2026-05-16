import type { ReportDraftWire } from '../models/report-draft-api.types';

export interface IReportDraftRepository {
  save(draft: ReportDraftWire): Promise<void>;
  findById(id: string): Promise<ReportDraftWire | null>;
  findByHunterId(hunterId: string): Promise<ReportDraftWire[]>;
}

export const I_REPORT_DRAFT_REPOSITORY = Symbol('I_REPORT_DRAFT_REPOSITORY');
