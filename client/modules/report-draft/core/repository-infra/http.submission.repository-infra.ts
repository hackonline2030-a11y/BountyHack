import { fetchBff } from "@/lib/bff-fetch";
import { readFriendlyHttpError } from "@/lib/http-error-message";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { ISubmissionRepository } from "@modules/report-draft/core/repository/submission.repository";
import { parseJsonResponse } from "@modules/report-draft/core/repository-infra/http-json";

export class HttpSubmissionRepository implements ISubmissionRepository {
  async save(submission: ReportDraftDomainModel.Submission<unknown>): Promise<void> {
    const res = await fetchBff("/api/report-draft/submissions", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    if (!res.ok) {
      throw new Error(await readFriendlyHttpError(res, "Impossible d’enregistrer la soumission."));
    }
  }

  async findById(id: string): Promise<ReportDraftDomainModel.Submission<unknown> | null> {
    const res = await fetchBff(`/api/report-draft/submissions/${encodeURIComponent(id)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 404) {
      return null;
    }
    return parseJsonResponse(res);
  }

  async findByDraftId(
    draftId: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]> {
    const url = `/api/report-draft/submissions?draftId=${encodeURIComponent(draftId)}`;
    const res = await fetchBff(url, { credentials: "include", cache: "no-store" });
    return parseJsonResponse(res);
  }

  async findLatestForStep(
    draftId: ReportDraftDomainModel.ReportDraftId,
    step: ReportDraftDomainModel.ReportDraftStep,
  ): Promise<ReportDraftDomainModel.Submission<unknown> | null> {
    const all = await this.findByDraftId(draftId);
    const matches = all.filter((s) => s.step === step);
    if (matches.length === 0) return null;
    return matches.reduce((best, current) => (current.round >= best.round ? current : best));
  }

  async findPendingForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]> {
    const url = `/api/report-draft/submissions?pendingForReviewer=${encodeURIComponent(reviewerRole)}`;
    const res = await fetchBff(url, { credentials: "include", cache: "no-store" });
    return parseJsonResponse(res);
  }

  async findAllForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]> {
    const url = `/api/report-draft/submissions?forReviewer=${encodeURIComponent(reviewerRole)}`;
    const res = await fetchBff(url, { credentials: "include", cache: "no-store" });
    return parseJsonResponse(res);
  }

  async findMentorPeerSubmissionsForQc(): Promise<
    ReportDraftDomainModel.Submission<unknown>[]
  > {
    const res = await fetchBff("/api/report-draft/submissions?mentorPeerForQc=true", {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }
}
