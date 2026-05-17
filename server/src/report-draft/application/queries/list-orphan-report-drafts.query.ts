import { Injectable } from '@nestjs/common';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftOrphanSummary } from '../../models/report-draft-orphan-summary.model';

/**
 * Drafts not linked to any report team (e.g. after team deletion).
 * RBAC: coordinator or super-admin on the HTTP controller.
 */
@Injectable()
export class ListOrphanReportDraftsQuery {
  constructor(private readonly repository: IReportDraftRepository) {}

  async execute(): Promise<ReportDraftOrphanSummary[]> {
    return this.repository.findOrphanSummaries();
  }
}
