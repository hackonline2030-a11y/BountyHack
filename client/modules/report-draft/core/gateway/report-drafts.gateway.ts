import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Outbound port for persisting and reading
 * {@link ReportDraftDomainModel.ReportDraft} aggregates. Production will be
 * backed by a relational DB (Prisma / Postgres); dev workflows and tests
 * use the in-memory adapter.
 *
 * Optimistic locking lives on the aggregate (`draft.version` is bumped by
 * every transition). The gateway is intentionally dumb about it for now —
 * concurrency guards belong to the use case layer if we need them. This
 * keeps the contract narrow and easy to swap.
 *
 * Contract honoured by every implementation
 * (cf. `in-memory.report-drafts.gateway-infra.test.ts`):
 *
 * - `save` is upsert-by-id (creates or replaces in full).
 * - Stored drafts are isolated from caller-side mutations (deep-clone on
 *   the way in and on the way out).
 * - List queries return deterministic ordering so callers + tests can
 *   rely on it without re-sorting.
 */
export interface IReportDraftsGateway {
  /**
   * Insert or replace the draft as-is. Typical flow:
   * 1. Hunter creates a fresh draft       → save (v=0)
   * 2. Hunter submits a step              → aggregate bumps to v=1 → save
   * 3. Reviewer approves                  → aggregate bumps to v=2 → save
   */
  save(draft: ReportDraftDomainModel.ReportDraft): Promise<void>;

  /** Returns a snapshot of the draft, or `null` if not found. */
  findById(
    id: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.ReportDraft | null>;

  /**
   * Returns every draft owned by the given hunter, sorted by `updatedAt`
   * descending (most recently touched first) — matches the "Mes rapports"
   * UX where the user expects to find what they were just working on at
   * the top. Ties (identical updatedAt) are broken by `id` ascending.
   */
  findByHunterId(
    hunterId: number,
  ): Promise<ReportDraftDomainModel.ReportDraft[]>;
}
