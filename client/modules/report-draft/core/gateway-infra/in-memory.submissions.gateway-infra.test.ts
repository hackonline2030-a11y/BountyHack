import { InMemorySubmissionsGateway } from "@modules/report-draft/core/gateway-infra/in-memory.submissions.gateway-infra";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

const Step = ReportDraftDomainModel.ReportDraftStep;

/**
 * Build a deterministic submission fixture so tests stay readable.
 * Defaults can be overridden field by field.
 */
const submissionFixture = (
  overrides: Partial<ReportDraftDomainModel.Submission<unknown>> = {},
): ReportDraftDomainModel.Submission<unknown> => ({
  id: "submission-1",
  reportDraftId: "draft-1",
  step: Step.META,
  round: 1,
  payload: { hello: "world" },
  attachmentsSnapshot: [],
  submittedAt: "2026-05-14T09:00:00.000Z",
  submittedBy: 42,
  reviewerRole: "mentor",
  decision: "pending",
  ...overrides,
});

describe("InMemorySubmissionsGateway (ISubmissionsGateway contract)", () => {
  // ──────────────────────────────────────────────────────────────────────
  // save / findById round-trip
  // ──────────────────────────────────────────────────────────────────────
  it("save + findById round-trip returns an equivalent submission", async () => {
    const repo = new InMemorySubmissionsGateway();
    const submission = submissionFixture();

    await repo.save(submission);
    const found = await repo.findById("submission-1");

    expect(found).toEqual(submission);
  });

  it("findById returns null for an unknown id", async () => {
    const repo = new InMemorySubmissionsGateway();

    expect(await repo.findById("does-not-exist")).toBeNull();
  });

  it("save with the same id overwrites the previous version (decision update flow)", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(submissionFixture({ decision: "pending" }));

    await repo.save(
      submissionFixture({
        decision: "approve",
        decidedAt: "2026-05-14T10:00:00.000Z",
        decidedBy: 99,
      }),
    );

    const found = await repo.findById("submission-1");
    expect(found?.decision).toEqual("approve");
    expect(found?.decidedBy).toEqual(99);
  });

  // ──────────────────────────────────────────────────────────────────────
  // Isolation — store insulated from caller-side mutations
  // ──────────────────────────────────────────────────────────────────────
  it("save deep-clones the input — later mutations on the original do not leak", async () => {
    const repo = new InMemorySubmissionsGateway();
    const submission = submissionFixture({ decision: "pending" });

    await repo.save(submission);
    submission.decision = "approve"; // mutate AFTER save

    const found = await repo.findById("submission-1");
    expect(found?.decision).toEqual("pending");
  });

  it("findById returns a clone — mutations on the result do not affect the store", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(submissionFixture({ decision: "pending" }));

    const first = await repo.findById("submission-1");
    first!.decision = "approve"; // mutate the returned object

    const second = await repo.findById("submission-1");
    expect(second?.decision).toEqual("pending");
  });

  // ──────────────────────────────────────────────────────────────────────
  // findByDraftId
  // ──────────────────────────────────────────────────────────────────────
  it("findByDraftId returns only the submissions matching the draft id", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(submissionFixture({ id: "s1", reportDraftId: "draft-1" }));
    await repo.save(submissionFixture({ id: "s2", reportDraftId: "draft-2" }));
    await repo.save(
      submissionFixture({ id: "s3", reportDraftId: "draft-1", step: Step.DESCRIPTION }),
    );

    const result = await repo.findByDraftId("draft-1");

    expect(result.map((s) => s.id).sort()).toEqual(["s1", "s3"]);
  });

  it("findByDraftId returns submissions ordered by round then step (deterministic)", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(
      submissionFixture({ id: "s-meta-r2", step: Step.META, round: 2 }),
    );
    await repo.save(
      submissionFixture({ id: "s-final-r1", step: Step.FINAL, round: 1 }),
    );
    await repo.save(
      submissionFixture({ id: "s-meta-r1", step: Step.META, round: 1 }),
    );

    const result = await repo.findByDraftId("draft-1");

    expect(result.map((s) => s.id)).toEqual([
      "s-meta-r1", // round 1, step META  (0)
      "s-final-r1", // round 1, step FINAL (7)
      "s-meta-r2", // round 2, step META  (0)
    ]);
  });

  it("findByDraftId returns an empty array when no submissions match", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(submissionFixture({ reportDraftId: "draft-99" }));

    expect(await repo.findByDraftId("draft-1")).toEqual([]);
  });

  // ──────────────────────────────────────────────────────────────────────
  // findLatestForStep
  // ──────────────────────────────────────────────────────────────────────
  it("findLatestForStep returns the highest-round submission for the (draft, step) pair", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(
      submissionFixture({ id: "round-1", step: Step.META, round: 1 }),
    );
    await repo.save(
      submissionFixture({ id: "round-3", step: Step.META, round: 3 }),
    );
    await repo.save(
      submissionFixture({ id: "round-2", step: Step.META, round: 2 }),
    );

    const latest = await repo.findLatestForStep("draft-1", Step.META);

    expect(latest?.id).toEqual("round-3");
  });

  it("findLatestForStep ignores submissions for a different step on the same draft", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(
      submissionFixture({ id: "meta-r1", step: Step.META, round: 1 }),
    );
    await repo.save(
      submissionFixture({ id: "desc-r2", step: Step.DESCRIPTION, round: 2 }),
    );

    const latest = await repo.findLatestForStep("draft-1", Step.META);

    expect(latest?.id).toEqual("meta-r1");
  });

  it("findLatestForStep returns null when the step has never been submitted", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(submissionFixture({ step: Step.META, round: 1 }));

    expect(await repo.findLatestForStep("draft-1", Step.FINAL)).toBeNull();
  });

  it("findLatestForStep ignores submissions on other drafts even at higher rounds", async () => {
    const repo = new InMemorySubmissionsGateway();
    await repo.save(
      submissionFixture({
        id: "other-draft-r5",
        reportDraftId: "draft-99",
        step: Step.META,
        round: 5,
      }),
    );
    await repo.save(
      submissionFixture({
        id: "our-draft-r1",
        reportDraftId: "draft-1",
        step: Step.META,
        round: 1,
      }),
    );

    const latest = await repo.findLatestForStep("draft-1", Step.META);

    expect(latest?.id).toEqual("our-draft-r1");
  });
});
