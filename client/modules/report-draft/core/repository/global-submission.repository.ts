import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export interface IGlobalSubmissionRepository {
  findById(globalSubmissionId: string): Promise<ReportDraftDomainModel.GlobalSubmission | null>;

  create(input: { draftId: string }): Promise<ReportDraftDomainModel.GlobalSubmission[]>;

  findByDraftId(
    draftId: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]>;

  findPendingForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]>;

  findAllForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]>;

  listComments(
    globalSubmissionId: string,
  ): Promise<ReportDraftDomainModel.GlobalReviewerComment[]>;

  approve(globalSubmissionId: string): Promise<ReportDraftDomainModel.ReportDraft>;

  requestChanges(
    globalSubmissionId: string,
    comments: string[],
  ): Promise<ReportDraftDomainModel.ReportDraft>;
}
