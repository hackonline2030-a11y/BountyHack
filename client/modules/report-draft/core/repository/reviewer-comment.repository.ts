import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Persistence port for {@link ReportDraftDomainModel.ReviewerComment}s.
 */
export interface IReviewerCommentRepository {
  saveMany(
    comments: ReadonlyArray<ReportDraftDomainModel.ReviewerComment>,
  ): Promise<void>;

  findBySubmissionId(
    submissionId: string,
  ): Promise<ReportDraftDomainModel.ReviewerComment[]>;

  /** Mentor + QC comments for the same wizard step. */
  findForReviewStep(
    submissionId: string,
  ): Promise<ReportDraftDomainModel.ReviewerComment[]>;
}
