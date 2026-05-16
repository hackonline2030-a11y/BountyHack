import { InMemoryReviewerCommentRepository } from "@modules/report-draft/core/repository-infra/in-memory.reviewer-comment.repository-infra";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Build a deterministic ReviewerComment fixture. Defaults can be
 * overridden field-by-field.
 */
const commentFixture = (
  overrides: Partial<ReportDraftDomainModel.ReviewerComment> = {},
): ReportDraftDomainModel.ReviewerComment => ({
  id: "comment-1",
  submissionId: "submission-1",
  authorId: "u-99",
  authorRole: "mentor",
  body: "Please clarify this part.",
  createdAt: "2026-05-14T10:00:00.000Z",
  ...overrides,
});

describe("InMemoryReviewerCommentRepository (IReviewerCommentsGateway contract)", () => {
  // ──────────────────────────────────────────────────────────────────────
  // saveMany / findBySubmissionId round-trip
  // ──────────────────────────────────────────────────────────────────────
  it("saveMany + findBySubmissionId round-trip returns the saved comments", async () => {
    const repo = new InMemoryReviewerCommentRepository();
    const comment = commentFixture();

    await repo.saveMany([comment]);
    const found = await repo.findBySubmissionId("submission-1");

    expect(found).toEqual([comment]);
  });

  it("findBySubmissionId returns an empty array when the submission has no comments", async () => {
    const repo = new InMemoryReviewerCommentRepository();

    expect(await repo.findBySubmissionId("does-not-exist")).toEqual([]);
  });

  it("saveMany([]) is a no-op (empty bundle = no error, no side-effect)", async () => {
    const repo = new InMemoryReviewerCommentRepository();

    await expect(repo.saveMany([])).resolves.toBeUndefined();
    expect(await repo.findBySubmissionId("submission-1")).toEqual([]);
  });

  // ──────────────────────────────────────────────────────────────────────
  // Accumulation across calls (NOT replace)
  // ──────────────────────────────────────────────────────────────────────
  it("saveMany accumulates across calls (does not replace prior comments)", async () => {
    const repo = new InMemoryReviewerCommentRepository();
    await repo.saveMany([commentFixture({ id: "c1" })]);

    await repo.saveMany([commentFixture({ id: "c2" })]);

    const found = await repo.findBySubmissionId("submission-1");
    expect(found.map((c) => c.id).sort()).toEqual(["c1", "c2"]);
  });

  // ──────────────────────────────────────────────────────────────────────
  // Isolation — store insulated from caller-side mutations
  // ──────────────────────────────────────────────────────────────────────
  it("saveMany deep-clones each comment — later mutations on the original do not leak", async () => {
    const repo = new InMemoryReviewerCommentRepository();
    const comment = commentFixture({ body: "original body" });

    await repo.saveMany([comment]);
    comment.body = "MUTATED-AFTER-SAVE";

    const [found] = await repo.findBySubmissionId("submission-1");
    expect(found.body).toEqual("original body");
  });

  it("findBySubmissionId returns clones — mutations on the result do not affect the store", async () => {
    const repo = new InMemoryReviewerCommentRepository();
    await repo.saveMany([commentFixture({ body: "original body" })]);

    const [first] = await repo.findBySubmissionId("submission-1");
    first.body = "MUTATED";

    const [second] = await repo.findBySubmissionId("submission-1");
    expect(second.body).toEqual("original body");
  });

  // ──────────────────────────────────────────────────────────────────────
  // Filtering & ordering
  // ──────────────────────────────────────────────────────────────────────
  it("findBySubmissionId returns only comments matching the submission id", async () => {
    const repo = new InMemoryReviewerCommentRepository();
    await repo.saveMany([
      commentFixture({ id: "c1", submissionId: "sub-A" }),
      commentFixture({ id: "c2", submissionId: "sub-B" }),
      commentFixture({ id: "c3", submissionId: "sub-A" }),
    ]);

    const found = await repo.findBySubmissionId("sub-A");

    expect(found.map((c) => c.id).sort()).toEqual(["c1", "c3"]);
  });

  it("findBySubmissionId sorts by createdAt ASC (chronological reading order)", async () => {
    const repo = new InMemoryReviewerCommentRepository();
    await repo.saveMany([
      commentFixture({ id: "c-newest", createdAt: "2026-05-14T12:00:00.000Z" }),
      commentFixture({ id: "c-oldest", createdAt: "2026-05-14T10:00:00.000Z" }),
      commentFixture({ id: "c-middle", createdAt: "2026-05-14T11:00:00.000Z" }),
    ]);

    const found = await repo.findBySubmissionId("submission-1");

    expect(found.map((c) => c.id)).toEqual(["c-oldest", "c-middle", "c-newest"]);
  });

  it("findBySubmissionId breaks createdAt ties with id ASC (deterministic)", async () => {
    const repo = new InMemoryReviewerCommentRepository();
    const sharedTimestamp = "2026-05-14T10:00:00.000Z";
    await repo.saveMany([
      commentFixture({ id: "c-c", createdAt: sharedTimestamp }),
      commentFixture({ id: "c-a", createdAt: sharedTimestamp }),
      commentFixture({ id: "c-b", createdAt: sharedTimestamp }),
    ]);

    const found = await repo.findBySubmissionId("submission-1");

    expect(found.map((c) => c.id)).toEqual(["c-a", "c-b", "c-c"]);
  });
});
