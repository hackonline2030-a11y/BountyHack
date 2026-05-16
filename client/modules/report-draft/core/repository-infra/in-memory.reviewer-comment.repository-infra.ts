import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IReviewerCommentRepository } from "@modules/report-draft/core/repository/reviewer-comment.repository";

export class InMemoryReviewerCommentRepository implements IReviewerCommentRepository {
  private readonly store = new Map<string, ReportDraftDomainModel.ReviewerComment>();

  async saveMany(
    comments: ReadonlyArray<ReportDraftDomainModel.ReviewerComment>,
  ): Promise<void> {
    for (const comment of comments) {
      this.store.set(comment.id, clone(comment));
    }
  }

  async findBySubmissionId(
    submissionId: string,
  ): Promise<ReportDraftDomainModel.ReviewerComment[]> {
    return Array.from(this.store.values())
      .filter((c) => c.submissionId === submissionId)
      .sort((a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt < b.createdAt ? -1 : 1;
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      })
      .map(clone);
  }

  async findForReviewStep(
    submissionId: string,
  ): Promise<ReportDraftDomainModel.ReviewerComment[]> {
    return this.findBySubmissionId(submissionId);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
