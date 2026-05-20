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

  uploadDescriptionSectionImage(input: {
    draftId: ReportDraftDomainModel.ReportDraftId;
    file: File;
  }): Promise<ReportDraftDomainModel.Attachment>;

  /** Super-admin hard delete (steps, submissions, team, legacy reports). */
  deletePermanently(draftId: ReportDraftDomainModel.ReportDraftId): Promise<void>;

  /**
   * Squad hunters may hand off who edits the draft (PATCH Nest). Refetches draft after success.
   */
  setHunterWriter(input: {
    draftId: ReportDraftDomainModel.ReportDraftId;
    hunterWriterId: string;
  }): Promise<void>;
}
