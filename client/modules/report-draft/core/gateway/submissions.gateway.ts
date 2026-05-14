import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Outbound port for storing and retrieving
 * {@link ReportDraftDomainModel.Submission}s. Speaks the domain language
 * directly (not `Response` / DTOs) because submissions live entirely
 * inside the `report-draft` bounded context — no external API is involved
 * for now. Future adapters (Prisma, Postgres, etc.) are expected to
 * (de)serialise transparently.
 *
 * Contract honoured by every implementation
 * (cf. `in-memory.submissions.gateway-infra.test.ts`):
 *
 * - `save` is upsert-by-id (creates or replaces).
 * - Stored submissions are isolated from caller-side mutations (deep-clone
 *   on the way in and on the way out).
 *
 * The gateway is **payload-agnostic** — submissions are stored as
 * `Submission<unknown>`. Callers know the expected payload shape from the
 * `step` discriminant and cast at the use-case layer.
 */
export interface ISubmissionsGateway {
  /**
   * Insert or replace the submission. Two consecutive `save`s with the
   * same id keep only the latest version (typical workflow: save once
   * after submit, save again after the reviewer's decision).
   */
  save(submission: ReportDraftDomainModel.Submission<unknown>): Promise<void>;

  /** Returns a snapshot of the submission, or `null` if not found. */
  findById(id: string): Promise<ReportDraftDomainModel.Submission<unknown> | null>;

  /**
   * Returns every submission attached to the given draft, sorted by
   * `round` ascending then `step` ascending (deterministic order). The
   * returned array is independent of the store — mutating it has no side
   * effect.
   */
  findByDraftId(
    draftId: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]>;

  /**
   * Returns the submission with the highest `round` for a given (draft,
   * step) pair, or `null` if the step was never submitted. Useful for
   * loading the "current review" view of a single step.
   */
  findLatestForStep(
    draftId: ReportDraftDomainModel.ReportDraftId,
    step: ReportDraftDomainModel.ReportDraftStep,
  ): Promise<ReportDraftDomainModel.Submission<unknown> | null>;
}
