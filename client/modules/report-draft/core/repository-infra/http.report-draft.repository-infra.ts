import { fetchBff } from "@/lib/bff-fetch";
import { readFriendlyHttpError } from "@/lib/http-error-message";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IReportDraftRepository } from "@modules/report-draft/core/repository/report-draft.repository";
import { parseJsonResponse } from "@modules/report-draft/core/repository-infra/http-json";

export class HttpReportDraftRepository implements IReportDraftRepository {
  async save(draft: ReportDraftDomainModel.ReportDraft): Promise<void> {
    const res = await fetchBff("/api/report-draft/drafts", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      throw new Error(await readFriendlyHttpError(res, "Impossible d’enregistrer le brouillon."));
    }
  }

  async findById(
    id: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.ReportDraft | null> {
    const res = await fetchBff(`/api/report-draft/drafts/${encodeURIComponent(id)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 404) {
      return null;
    }
    return parseJsonResponse(res);
  }

  async findByHunterId(hunterId: string): Promise<ReportDraftDomainModel.ReportDraft[]> {
    const url = `/api/report-draft/drafts?hunterId=${encodeURIComponent(hunterId)}`;
    const res = await fetchBff(url, { credentials: "include", cache: "no-store" });
    return parseJsonResponse(res);
  }

  async deletePermanently(
    draftId: ReportDraftDomainModel.ReportDraftId,
  ): Promise<void> {
    const res = await fetchBff(
      `/api/report-draft/admin/drafts/${encodeURIComponent(draftId)}`,
      { method: "DELETE", credentials: "include" },
    );
    if (!res.ok) {
      throw new Error(
        await readFriendlyHttpError(res, "Impossible de supprimer le brouillon de rapport."),
      );
    }
  }
}
