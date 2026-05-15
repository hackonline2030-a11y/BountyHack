import { fetchBff } from "@/lib/bff-fetch";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IReviewerCommentRepository } from "@modules/report-draft/core/repository/reviewer-comment.repository";

const json = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export class HttpReviewerCommentRepository implements IReviewerCommentRepository {
  async saveMany(
    comments: ReadonlyArray<ReportDraftDomainModel.ReviewerComment>,
  ): Promise<void> {
    const res = await fetchBff("/api/report-draft/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comments),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }

  async findBySubmissionId(
    submissionId: string,
  ): Promise<ReportDraftDomainModel.ReviewerComment[]> {
    const url = `/api/report-draft/comments?submissionId=${encodeURIComponent(submissionId)}`;
    const res = await fetchBff(url, { credentials: "include", cache: "no-store" });
    return json(res);
  }
}
