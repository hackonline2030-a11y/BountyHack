import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Persistence port for {@link ReportDraftDomainModel.ReportDraft} aggregates.
 * Production: Prisma/Postgres adapter. Dev/tests: in-memory repository-infra.
 */
export interface IReportDraftRepository {
  save(draft: ReportDraftDomainModel.ReportDraft): Promise<void>;

  findById(
    id: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.ReportDraft | null>;

  findByHunterId(
    hunterId: string,
  ): Promise<ReportDraftDomainModel.ReportDraft[]>;
}
