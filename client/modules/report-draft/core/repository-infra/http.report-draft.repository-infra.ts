import { fetchBff } from "@/lib/bff-fetch";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IReportDraftRepository } from "@modules/report-draft/core/repository/report-draft.repository";

const json = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
};

/**
 * BFF-backed {@link IReportDraftRepository} — persists via Next API routes
 * into the server singleton store (shared across browsers in dev).
 */
export class HttpReportDraftRepository implements IReportDraftRepository {
  async save(draft: ReportDraftDomainModel.ReportDraft): Promise<void> {
    const res = await fetchBff("/api/report-draft/drafts", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }

  async findById(
    id: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.ReportDraft | null> {
    const res = await fetchBff(`/api/report-draft/drafts/${encodeURIComponent(id)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 404) return null;
    return json(res);
  }

  async findByHunterId(hunterId: string): Promise<ReportDraftDomainModel.ReportDraft[]> {
    const url = `/api/report-draft/drafts?hunterId=${encodeURIComponent(hunterId)}`;
    const res = await fetchBff(url, { credentials: "include", cache: "no-store" });
    return json(res);
  }
}
