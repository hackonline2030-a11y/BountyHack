import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IReportDraftsGateway } from "@modules/report-draft/core/gateway/report-drafts.gateway";

/**
 * Test / dev-mode adapter for {@link IReportDraftsGateway} backed by a
 * `Map`. Faithful to the port's contract:
 *
 * - `save` deep-clones the incoming draft so subsequent mutations of the
 *   caller's aggregate state don't leak into the store (mirrors a real
 *   DB round-trip through serialisation).
 * - `findById` / `findByHunterId` return clones, so consumers cannot
 *   accidentally rewrite history by mutating what they got back.
 *
 * Enough to wire the whole `report-draft` flow end-to-end in dev (no DB
 * required) and to exercise use cases in tests without mocking.
 */
export class InMemoryReportDraftsGateway implements IReportDraftsGateway {
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
    hunterId: number,
  ): Promise<ReportDraftDomainModel.ReportDraft[]> {
    return Array.from(this.store.values())
      .filter((d) => d.hunterId === hunterId)
      .sort((a, b) => {
        if (a.updatedAt !== b.updatedAt) {
          // updatedAt DESC (most recent first)
          return a.updatedAt < b.updatedAt ? 1 : -1;
        }
        // tie-break by id ASC (deterministic)
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      })
      .map(clone);
  }
}

/**
 * JSON round-trip deep-clone. ReportDrafts carry primitive scalars,
 * strings, nested `StepState` records and arrays of attachment objects
 * (themselves primitive-only), so the round-trip is lossless. Avoids
 * `structuredClone` which isn't exposed by jsdom (the Jest env).
 */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
