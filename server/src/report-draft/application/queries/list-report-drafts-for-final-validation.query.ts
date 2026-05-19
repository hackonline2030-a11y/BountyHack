import { Injectable } from '@nestjs/common';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ReportDraftFinalValidationSummary } from '../../models/report-draft-final-validation-summary.model';
import { toReportDraftFinalValidationSummary } from '../mappers/report-draft-to-final-validation-summary.mapper';

/**
 * Super-admin validation: all report drafts (client filters by aggregate status).
 * RBAC: enforce `SUPER_ADMIN` on the HTTP controller only.
 */
@Injectable()
export class ListReportDraftsForFinalValidationQuery {
  constructor(private readonly repository: IReportDraftRepository) {}

  async execute(): Promise<ReportDraftFinalValidationSummary[]> {
    const drafts = await this.repository.findAll();
    return drafts.map(toReportDraftFinalValidationSummary);
  }
}
