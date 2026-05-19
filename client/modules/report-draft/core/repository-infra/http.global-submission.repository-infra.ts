import { fetchBff } from "@/lib/bff-fetch";
import { readFriendlyHttpError } from "@/lib/http-error-message";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IGlobalSubmissionRepository } from "@modules/report-draft/core/repository/global-submission.repository";
import { parseJsonResponse } from "@modules/report-draft/core/repository-infra/http-json";

const BASE = "/api/report-draft/global-submissions";

export class HttpGlobalSubmissionRepository implements IGlobalSubmissionRepository {
  async findById(
    globalSubmissionId: string,
  ): Promise<ReportDraftDomainModel.GlobalSubmission | null> {
    const res = await fetchBff(`${BASE}/${encodeURIComponent(globalSubmissionId)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 404) return null;
    return parseJsonResponse(res);
  }

  async create(input: {
    draftId: string;
  }): Promise<ReportDraftDomainModel.GlobalSubmission[]> {
    const res = await fetchBff(BASE, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: input.draftId }),
    });
    if (!res.ok) {
      throw new Error(
        await readFriendlyHttpError(res, "Impossible de soumettre le brouillon globalement."),
      );
    }
    return parseJsonResponse(res);
  }

  async findByDraftId(
    draftId: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]> {
    const res = await fetchBff(`${BASE}?draftId=${encodeURIComponent(draftId)}`, {
      credentials: "include",
      cache: "no-store",
    });
    return parseJsonResponse(res);
  }

  async findPendingForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]> {
    const res = await fetchBff(
      `${BASE}?pendingForReviewer=${encodeURIComponent(reviewerRole)}`,
      { credentials: "include", cache: "no-store" },
    );
    return parseJsonResponse(res);
  }

  async findAllForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.GlobalSubmission[]> {
    const res = await fetchBff(
      `${BASE}?forReviewer=${encodeURIComponent(reviewerRole)}`,
      { credentials: "include", cache: "no-store" },
    );
    return parseJsonResponse(res);
  }

  async listComments(
    globalSubmissionId: string,
  ): Promise<ReportDraftDomainModel.GlobalReviewerComment[]> {
    const res = await fetchBff(
      `${BASE}/${encodeURIComponent(globalSubmissionId)}/comments`,
      { credentials: "include", cache: "no-store" },
    );
    return parseJsonResponse(res);
  }

  async approve(
    globalSubmissionId: string,
  ): Promise<ReportDraftDomainModel.ReportDraft> {
    const res = await fetchBff(
      `${BASE}/${encodeURIComponent(globalSubmissionId)}/approve`,
      { method: "POST", credentials: "include" },
    );
    if (!res.ok) {
      throw new Error(
        await readFriendlyHttpError(res, "Impossible de valider la révision globale."),
      );
    }
    return parseJsonResponse(res);
  }

  async requestChanges(
    globalSubmissionId: string,
    comments: string[],
  ): Promise<ReportDraftDomainModel.ReportDraft> {
    const res = await fetchBff(
      `${BASE}/${encodeURIComponent(globalSubmissionId)}/request-changes`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      },
    );
    if (!res.ok) {
      throw new Error(
        await readFriendlyHttpError(
          res,
          "Impossible de demander des révisions sur la soumission globale.",
        ),
      );
    }
    return parseJsonResponse(res);
  }
}
