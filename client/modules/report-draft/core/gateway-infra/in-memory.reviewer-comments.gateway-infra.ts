import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { IReviewerCommentsGateway } from "@modules/report-draft/core/gateway/reviewer-comments.gateway";

/**
 * Test / dev-mode adapter for {@link IReviewerCommentsGateway} backed by a
 * `Map`. Faithful to the port's contract:
 *
 * - `saveMany` deep-clones each incoming comment so subsequent mutations
 *   on the caller's references don't leak into the store.
 * - `findBySubmissionId` returns clones too — consumers cannot
 *   accidentally rewrite history by mutating what they got back.
 * - Accumulates across calls : multiple `saveMany` invocations with
 *   different ids are additive; same id → upsert.
 */
export class InMemoryReviewerCommentsGateway implements IReviewerCommentsGateway {
  private readonly store = new Map<
    string,
    ReportDraftDomainModel.ReviewerComment
  >();

  async saveMany(
    comments: ReadonlyArray<ReportDraftDomainModel.ReviewerComment>,
  ): Promise<void> {
    for (const comment of comments) {
      this.store.set(comment.id, clone(comment));
    }
  }

  async findBySubmissionId(
    submissionId: string,
  ): Promise<ReportDraftDomainModel.ReviewerComment[]> {
    return Array.from(this.store.values())
      .filter((c) => c.submissionId === submissionId)
      .sort((a, b) => {
        if (a.createdAt !== b.createdAt) {
          // createdAt ASC (chronological reading order)
          return a.createdAt < b.createdAt ? -1 : 1;
        }
        // tie-break by id ASC (deterministic)
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      })
      .map(clone);
  }
}

/**
 * JSON round-trip deep-clone. ReviewerComments carry primitive scalars,
 * strings, and an optional flat `anchor` object — round-trip is lossless.
 * Avoids `structuredClone` which isn't exposed by jsdom (the Jest env).
 */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
