import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IReportDraftRepository } from "@modules/report-draft/core/repository/report-draft.repository";

export class InMemoryReportDraftRepository implements IReportDraftRepository {
  private readonly store = new Map<
    ReportDraftDomainModel.ReportDraftId,
    ReportDraftDomainModel.ReportDraft
  >();

  async save(draft: ReportDraftDomainModel.ReportDraft): Promise<void> {
    this.store.set(draft.id, clone(draft));
  }

  async findById(
    id: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.ReportDraft | null> {
    const found = this.store.get(id);
    return found ? clone(found) : null;
  }

  async findByHunterId(
    hunterId: string,
  ): Promise<ReportDraftDomainModel.ReportDraft[]> {
    return Array.from(this.store.values())
      .filter((d) => d.hunterId === hunterId)
      .sort((a, b) => {
        if (a.updatedAt !== b.updatedAt) {
          return a.updatedAt < b.updatedAt ? 1 : -1;
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      })
      .map(clone);
  }

  async deletePermanently(
    id: ReportDraftDomainModel.ReportDraftId,
  ): Promise<void> {
    this.store.delete(id);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
