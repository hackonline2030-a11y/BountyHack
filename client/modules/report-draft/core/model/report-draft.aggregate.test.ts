import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import {
  ReportDraftFactory,
  type CreateReportDraftDeps,
} from "@modules/report-draft/core/model/report-draft.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";

const Step = ReportDraftDomainModel.ReportDraftStep;

/**
 * Build a fresh aggregate ready for `submitStepForReview` tests.
 * Returns the aggregate plus a handle on the underlying draft so tests can
 * directly set up pre-conditions (e.g. force `aggregateStatus = "given-up"`).
 *
 * The factory consumes the first id of the sequence (for `draft.id`) and
 * the first clock tick (for `createdAt`), so any sequence passed in needs
 * to start with those before the values consumed by `submitStepForReview`.
 */
const makeAggregate = (seed?: {
  ids?: string[];
  clockTicks?: string[];
  hunterId?: number;
  draftOverrides?: CreateReportDraftDeps["overrides"];
}) => {
  const idProvider = new StubIdProvider(seed?.ids);
  const clock = new StubClockProvider(seed?.clockTicks);
  const draft = ReportDraftFactory.create({
    idProvider,
    clock,
    hunterId: seed?.hunterId ?? 42,
    overrides: seed?.draftOverrides,
  });
  const aggregate = new ReportDraftAggregate(draft, { idProvider, clock });
  return { aggregate, draft, idProvider, clock };
};

describe("ReportDraftAggregate.submitStepForReview", () => {
  // ──────────────────────────────────────────────────────────────────────
  // Happy path — step state transitions
  // ──────────────────────────────────────────────────────────────────────
  it("moves the step from 'in-progress' to 'awaiting-review'", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(draft.meta.status).toEqual("awaiting-review");
  });

  it("increments currentRound to 1 on the first submission", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(draft.meta.currentRound).toEqual(1);
  });

  it("assigns the reviewer role on the step", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: 42,
    });

    expect(draft.meta.assignedReviewerRole).toEqual("quality_checker");
  });

  // ──────────────────────────────────────────────────────────────────────
  // Happy path — aggregate state transitions
  // ──────────────────────────────────────────────────────────────────────
  it("transitions the aggregate status from 'draft' to 'under-review' on the first submit", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(draft.aggregateStatus).toEqual("under-review");
  });

  it("keeps the aggregate status at 'under-review' when submitting a further step", () => {
    const { aggregate, draft } = makeAggregate();
    // First submit moves draft → under-review.
    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    aggregate.submitStepForReview({
      step: Step.DESCRIPTION,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(draft.aggregateStatus).toEqual("under-review");
  });

  it("bumps updatedAt to the current clock time on submit", () => {
    const { aggregate, draft } = makeAggregate({
      clockTicks: ["2026-05-14T10:00:00.000Z", "2026-05-14T11:00:00.000Z"],
    });

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(draft.updatedAt).toEqual("2026-05-14T11:00:00.000Z");
  });

  it("bumps the optimistic-lock version by 1 on submit", () => {
    const { aggregate, draft } = makeAggregate();
    expect(draft.version).toEqual(0);

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(draft.version).toEqual(1);
  });

  // ──────────────────────────────────────────────────────────────────────
  // Returned Submission
  // ──────────────────────────────────────────────────────────────────────
  it("returns a Submission carrying the correct step / round / reviewerRole / submittedBy / decision", () => {
    const { aggregate, draft } = makeAggregate();

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 99,
    });

    expect(submission.step).toEqual(Step.META);
    expect(submission.round).toEqual(1);
    expect(submission.reviewerRole).toEqual("mentor");
    expect(submission.submittedBy).toEqual(99);
    expect(submission.decision).toEqual("pending");
    expect(submission.reportDraftId).toEqual(draft.id);
  });

  it("uses the id provider to generate the submission id", () => {
    const { aggregate } = makeAggregate({
      ids: ["draft-id-1", "submission-id-1"],
    });

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(submission.id).toEqual("submission-id-1");
  });

  it("stamps the submission with the clock's current time", () => {
    const { aggregate } = makeAggregate({
      clockTicks: ["2026-05-14T10:00:00.000Z", "2026-05-14T11:00:00.000Z"],
    });

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(submission.submittedAt).toEqual("2026-05-14T11:00:00.000Z");
  });

  it("snapshots the step payload — later edits to the draft do NOT mutate the submission", () => {
    const { aggregate, draft } = makeAggregate({
      draftOverrides: { meta: MetaFactory.create({ bugType: "XSS" }) },
    });

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    draft.meta.payload.bugType = "MUTATED-AFTER-SNAPSHOT";

    const snap = submission.payload as ReportDraftDomainModel.MetaFields;
    expect(snap.bugType).toEqual("XSS");
  });

  it("snapshots attachments — later additions to the live list do NOT appear in the submission", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.attachments.push({
      id: "att-1",
      filename: "screenshot.png",
      mimeType: "image/png",
      sizeBytes: 1024,
      storageKey: "key-1",
      uploadedAt: "2026-05-14T09:00:00.000Z",
      uploadedBy: 42,
    });

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    draft.meta.attachments.push({
      id: "att-2",
      filename: "added-after.png",
      mimeType: "image/png",
      sizeBytes: 2048,
      storageKey: "key-2",
      uploadedAt: "2026-05-14T12:00:00.000Z",
      uploadedBy: 42,
    });

    expect(submission.attachmentsSnapshot).toHaveLength(1);
    expect(submission.attachmentsSnapshot[0].id).toEqual("att-1");
  });

  // ──────────────────────────────────────────────────────────────────────
  // Invariants — step status guard
  // ──────────────────────────────────────────────────────────────────────
  it("allows submitting again from 'needs-revision' (round 2+ after reviewer feedback)", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = "needs-revision";
    draft.meta.currentRound = 1;

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "mentor",
      submittedBy: 42,
    });

    expect(draft.meta.status).toEqual("awaiting-review");
    expect(draft.meta.currentRound).toEqual(2);
  });

  it("throws when the step is already 'awaiting-review'", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = "awaiting-review";

    expect(() =>
      aggregate.submitStepForReview({
        step: Step.META,
        reviewerRole: "mentor",
        submittedBy: 42,
      }),
    ).toThrow(/current status is 'awaiting-review'/);
  });

  it("throws when the step is already 'approved'", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = "approved";

    expect(() =>
      aggregate.submitStepForReview({
        step: Step.META,
        reviewerRole: "mentor",
        submittedBy: 42,
      }),
    ).toThrow(/current status is 'approved'/);
  });

  // ──────────────────────────────────────────────────────────────────────
  // Invariants — aggregate terminal-status guard
  // ──────────────────────────────────────────────────────────────────────
  it.each([
    ["given-up"],
    ["rejected"],
    ["submitted-to-program"],
  ] as const)(
    "throws when the aggregate is '%s' (terminal state)",
    (terminalStatus) => {
      const { aggregate, draft } = makeAggregate();
      draft.aggregateStatus = terminalStatus;

      expect(() =>
        aggregate.submitStepForReview({
          step: Step.META,
          reviewerRole: "mentor",
          submittedBy: 42,
        }),
      ).toThrow(/terminal state/);
    },
  );
});
