import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Outbound port for persisting and reading
 * {@link ReportDraftDomainModel.ReviewerComment}s.
 *
 * Comments are FK'd to their parent {@link ReportDraftDomainModel.Submission}
 * (not directly to a `ReportDraft`). Cross-aggregate queries ("all
 * comments of a draft") are deliberately NOT exposed here: they are use-case
 * orchestration concerns (list submissions, then list comments per submission).
 *
 * Comments are **append-only** in V1: once `saveMany` has stored a comment,
 * we do not edit or delete it. `resolvedAt` exists on the model and would
 * be set via a future `markResolved` operation when the editing workflow
 * needs it.
 *
 * Contract honoured by every implementation
 * (cf. `in-memory.reviewer-comments.gateway-infra.test.ts`):
 *
 * - `saveMany` accumulates across calls (does NOT replace prior comments
 *   of the same submission). Passing the same id twice across calls upserts.
 * - Stored comments are isolated from caller-side mutations (deep-clone
 *   in / out).
 * - `findBySubmissionId` returns comments sorted by `createdAt` ascending
 *   (chronological feedback thread), tie-broken by `id` ascending.
 */
export interface IReviewerCommentsGateway {
  /**
   * Bulk-insert / upsert. Typical caller: a `requestStepRevisions` use
   * case passes the comment list returned by the aggregate in one call,
   * keeping the "one decision = one feedback bundle" semantic.
   *
   * Empty `comments` is a no-op.
   */
  saveMany(
    comments: ReadonlyArray<ReportDraftDomainModel.ReviewerComment>,
  ): Promise<void>;

  /**
   * Returns every comment attached to the given submission, oldest first.
   * Empty array if the submission has no comments (or doesn't exist —
   * the gateway does NOT validate that the submission id is real, that's
   * the use case's job).
   */
  findBySubmissionId(
    submissionId: string,
  ): Promise<ReportDraftDomainModel.ReviewerComment[]>;
}
