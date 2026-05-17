import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IGlobalSubmissionRepository } from "@modules/report-draft/core/repository/global-submission.repository";

export class InMemoryGlobalSubmissionRepository implements IGlobalSubmissionRepository {
  private readonly byId = new Map<string, ReportDraftDomainModel.GlobalSubmission>();
  private readonly commentsByGlobalSubmissionId = new Map<
    string,
    ReportDraftDomainModel.GlobalReviewerComment[]
  >();

  async findById(
    globalSubmissionId: string,
  ): Promise<ReportDraftDomainModel.GlobalSubmission | null> {
    return this.byId.get(globalSubmissionId) ?? null;
  }

  async create(input: {
    draftId: string;
  }): Promise<ReportDraftDomainModel.GlobalSubmission[]> {
    const rows: ReportDraftDomainModel.GlobalSubmission[] = [
      {
        id: `global-qc-${this.byId.size + 1}`,
        reportDraftId: input.draftId,
        revisionNumber: 1,
        payload: {},
        submittedAt: new Date().toISOString(),
        submittedBy: "hunter",
        reviewerRole: "quality_checker",
        decision: "pending",
      },
      {
        id: `global-sa-${this.byId.size + 1}`,
        reportDraftId: input.draftId,
        revisionNumber: 1,
        payload: {},
        submittedAt: new Date().toISOString(),
        submittedBy: "hunter",
        reviewerRole: "super_admin",
        decision: "pending",
      },
    ];
    for (const row of rows) {
      this.byId.set(row.id, row);
    }
    return rows;
  }

  async findByDraftId(
    draftId: string,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]> {
    return [...this.byId.values()].filter((g) => g.reportDraftId === draftId);
  }

  async findPendingForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]> {
    return [...this.byId.values()].filter(
      (g) => g.reviewerRole === reviewerRole && g.decision === "pending",
    );
  }

  async findAllForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]> {
    return [...this.byId.values()].filter((g) => g.reviewerRole === reviewerRole);
  }

  async listComments(
    globalSubmissionId: string,
  ): Promise<ReportDraftDomainModel.GlobalReviewerComment[]> {
    return this.commentsByGlobalSubmissionId.get(globalSubmissionId) ?? [];
  }

  async approve(): Promise<ReportDraftDomainModel.ReportDraft> {
    throw new Error("InMemoryGlobalSubmissionRepository.approve not implemented");
  }

  async requestChanges(): Promise<ReportDraftDomainModel.ReportDraft> {
    throw new Error("InMemoryGlobalSubmissionRepository.requestChanges not implemented");
  }
}
