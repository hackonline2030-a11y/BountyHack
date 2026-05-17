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
  hunterId?: string;
  draftOverrides?: CreateReportDraftDeps["overrides"];
}) => {
  const idProvider = new StubIdProvider(seed?.ids);
  const clock = new StubClockProvider(seed?.clockTicks);
  const draft = ReportDraftFactory.create({
    idProvider,
    clock,
    hunterId: seed?.hunterId ?? "u-42",
    overrides: seed?.draftOverrides,
  });
  const aggregate = new ReportDraftAggregate(draft, { idProvider, clock });
  return { aggregate, draft, idProvider, clock };
};

/**
 * Build an aggregate with a single step already submitted for review,
 * mirroring the typical entry-state for reviewer-side commands.
 */
const seededWithSubmission = (
  step: ReportDraftDomainModel.ReportDraftStep = Step.META,
  seedOverrides?: Parameters<typeof makeAggregate>[0],
) => {
  const base = makeAggregate(seedOverrides);
  const submission = base.aggregate.submitStepForReview({
    step,
    reviewerRole: "quality_checker",
    submittedBy: "u-42",
  });
  return { ...base, submission };
};

const seededWithMentorAdvice = (
  step: ReportDraftDomainModel.ReportDraftStep = Step.META,
  seedOverrides?: Parameters<typeof makeAggregate>[0],
) => {
  const base = makeAggregate(seedOverrides);
  const submission = base.aggregate.submitMentorAdvice({
    step,
    submittedBy: "u-42",
  });
  return { ...base, submission };
};

describe("ReportDraftAggregate.submitStepForReview", () => {
  // ──────────────────────────────────────────────────────────────────────
  // Happy path — step state transitions
  // ──────────────────────────────────────────────────────────────────────
  it("moves the step from 'in-progress' to 'awaiting-review'", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(draft.meta.status).toEqual("awaiting-review");
  });

  it("increments currentRound to 1 on the first submission", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(draft.meta.currentRound).toEqual(1);
  });

  it("assigns the reviewer role on the step", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
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
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(draft.aggregateStatus).toEqual("under-review");
  });

  it("keeps the aggregate status at 'under-review' when submitting a further step", () => {
    const { aggregate, draft } = makeAggregate();
    // First submit moves draft → under-review.
    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    aggregate.submitStepForReview({
      step: Step.DESCRIPTION,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(draft.aggregateStatus).toEqual("under-review");
  });

  it("bumps updatedAt to the current clock time on submit", () => {
    const { aggregate, draft } = makeAggregate({
      clockTicks: ["2026-05-14T10:00:00.000Z", "2026-05-14T11:00:00.000Z"],
    });

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(draft.updatedAt).toEqual("2026-05-14T11:00:00.000Z");
  });

  it("bumps the optimistic-lock version by 1 on submit", () => {
    const { aggregate, draft } = makeAggregate();
    expect(draft.version).toEqual(0);

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
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
      reviewerRole: "quality_checker",
      submittedBy: "u-99",
    });

    expect(submission.step).toEqual(Step.META);
    expect(submission.round).toEqual(1);
    expect(submission.reviewerRole).toEqual("quality_checker");
    expect(submission.submittedBy).toEqual("u-99");
    expect(submission.decision).toEqual("pending");
    expect(submission.reportDraftId).toEqual(draft.id);
  });

  it("uses the id provider to generate the submission id", () => {
    const { aggregate } = makeAggregate({
      ids: ["draft-id-1", "submission-id-1"],
    });

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(submission.id).toEqual("submission-id-1");
  });

  it("stamps the submission with the clock's current time", () => {
    const { aggregate } = makeAggregate({
      clockTicks: ["2026-05-14T10:00:00.000Z", "2026-05-14T11:00:00.000Z"],
    });

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(submission.submittedAt).toEqual("2026-05-14T11:00:00.000Z");
  });

  it("snapshots the step payload — later edits to the draft do NOT mutate the submission", () => {
    const { aggregate, draft } = makeAggregate({
      draftOverrides: { meta: MetaFactory.create({ bugType: "XSS" }) },
    });

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
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
      uploadedBy: "u-42",
    });

    const submission = aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    draft.meta.attachments.push({
      id: "att-2",
      filename: "added-after.png",
      mimeType: "image/png",
      sizeBytes: 2048,
      storageKey: "key-2",
      uploadedAt: "2026-05-14T12:00:00.000Z",
      uploadedBy: "u-42",
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
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(draft.meta.status).toEqual("awaiting-review");
    expect(draft.meta.currentRound).toEqual(2);
  });

  it("rejects mentor as validation reviewer (use submitMentorAdvice)", () => {
    const { aggregate } = makeAggregate();

    expect(() =>
      aggregate.submitStepForReview({
        step: Step.META,
        reviewerRole: "mentor",
        submittedBy: "u-42",
      }),
    ).toThrow(/submitMentorAdvice/);
  });

  it("throws when the step is already 'awaiting-review'", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = "awaiting-review";

    expect(() =>
      aggregate.submitStepForReview({
        step: Step.META,
        reviewerRole: "quality_checker",
        submittedBy: "u-42",
      }),
    ).toThrow(/current status is 'awaiting-review'/);
  });

  it("throws when the step is already 'approved'", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = "approved";

    expect(() =>
      aggregate.submitStepForReview({
        step: Step.META,
        reviewerRole: "quality_checker",
        submittedBy: "u-42",
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
          reviewerRole: "quality_checker",
          submittedBy: "u-42",
        }),
      ).toThrow(/terminal state/);
    },
  );
});

describe("ReportDraftAggregate.submitMentorAdvice", () => {
  it("keeps the step in 'in-progress' (does not lock the hunter form)", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.submitMentorAdvice({ step: Step.META, submittedBy: "u-42" });

    expect(draft.meta.status).toEqual("in-progress");
    expect(draft.meta.assignedReviewerRole).toBeNull();
  });

  it("returns a mentor submission with incremented round", () => {
    const { aggregate } = makeAggregate();

    const submission = aggregate.submitMentorAdvice({
      step: Step.META,
      submittedBy: "u-42",
    });

    expect(submission.reviewerRole).toEqual("mentor");
    expect(submission.round).toEqual(1);
    expect(submission.decision).toEqual("pending");
  });

  it("allows mentor endorse while step stays in-progress", () => {
    const { aggregate, draft, submission } = seededWithMentorAdvice();

    aggregate.endorseSubmission({ submission, decidedBy: "mentor-1" });

    expect(submission.decision).toEqual("endorse");
    expect(draft.meta.status).toEqual("in-progress");
  });

  it("allows QC validation submit after mentor advice without mentor decision", () => {
    const { aggregate, draft } = makeAggregate();
    aggregate.submitMentorAdvice({ step: Step.META, submittedBy: "u-42" });

    aggregate.submitStepForReview({
      step: Step.META,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });

    expect(draft.meta.status).toEqual("awaiting-review");
    expect(draft.meta.assignedReviewerRole).toEqual("quality_checker");
  });
});

// ════════════════════════════════════════════════════════════════════════
// approveStep
// ════════════════════════════════════════════════════════════════════════
describe("ReportDraftAggregate.approveStep", () => {
  it("moves the step status from 'awaiting-review' to 'approved'", () => {
    const { aggregate, draft, submission } = seededWithSubmission();

    aggregate.approveStep({ submission, decidedBy: "u-99" });

    expect(draft.meta.status).toEqual("approved");
  });

  it("stamps the submission with decision='approve', decidedAt, decidedBy", () => {
    const { aggregate, submission } = seededWithSubmission(Step.META, {
      clockTicks: [
        "2026-05-14T08:00:00.000Z", // createdAt
        "2026-05-14T09:00:00.000Z", // submittedAt
        "2026-05-14T10:00:00.000Z", // decidedAt
      ],
    });

    aggregate.approveStep({ submission, decidedBy: "u-99" });

    expect(submission.decision).toEqual("approve");
    expect(submission.decidedAt).toEqual("2026-05-14T10:00:00.000Z");
    expect(submission.decidedBy).toEqual("u-99");
  });

  it("bumps version and updatedAt on the draft", () => {
    const { aggregate, draft, submission } = seededWithSubmission(Step.META, {
      clockTicks: [
        "2026-05-14T08:00:00.000Z",
        "2026-05-14T09:00:00.000Z",
        "2026-05-14T10:00:00.000Z",
      ],
    });
    const versionBefore = draft.version;

    aggregate.approveStep({ submission, decidedBy: "u-99" });

    expect(draft.version).toEqual(versionBefore + 1);
    expect(draft.updatedAt).toEqual("2026-05-14T10:00:00.000Z");
  });

  it("keeps aggregateStatus at 'under-review' when other steps are not yet approved", () => {
    const { aggregate, draft, submission } = seededWithSubmission();
    expect(draft.aggregateStatus).toEqual("under-review");

    aggregate.approveStep({ submission, decidedBy: "u-99" });

    expect(draft.aggregateStatus).toEqual("under-review");
  });

  it("transitions aggregateStatus to 'ready-to-program' when all 8 steps are approved", () => {
    const { aggregate, draft } = makeAggregate();
    // Pre-approve the first 7 steps directly (simulates a draft well-advanced
    // in its review cycle).
    draft.meta.status = "approved";
    draft.description.status = "approved";
    draft.collection.status = "approved";
    draft.exploitation.status = "approved";
    draft.proofOfConcept.status = "approved";
    draft.risks.status = "approved";
    draft.remediation.status = "approved";

    // Submit + approve the FINAL step
    const finalSubmission = aggregate.submitStepForReview({
      step: Step.FINAL,
      reviewerRole: "quality_checker",
      submittedBy: "u-42",
    });
    aggregate.approveStep({ submission: finalSubmission, decidedBy: "u-99" });

    expect(draft.aggregateStatus).toEqual("ready-to-program");
  });

  it("throws when the step is no longer 'awaiting-review' (already approved)", () => {
    const { aggregate, draft, submission } = seededWithSubmission();
    draft.meta.status = "approved";

    expect(() => aggregate.approveStep({ submission, decidedBy: "u-99" })).toThrow(
      /current status is 'approved'/,
    );
  });

  it("throws when the submission has already been decided", () => {
    const { aggregate, submission } = seededWithSubmission();
    submission.decision = "approve";

    expect(() => aggregate.approveStep({ submission, decidedBy: "u-99" })).toThrow(
      /already decided \('approve'\)/,
    );
  });

  it("throws when the submission's round is stale (step has moved on)", () => {
    const { aggregate, draft, submission } = seededWithSubmission();
    draft.meta.currentRound = submission.round + 1;

    expect(() => aggregate.approveStep({ submission, decidedBy: "u-99" })).toThrow(
      /stale round/,
    );
  });

  it("throws when the submission belongs to a different draft", () => {
    const { aggregate, submission } = seededWithSubmission();
    submission.reportDraftId = "some-other-draft-id";

    expect(() => aggregate.approveStep({ submission, decidedBy: "u-99" })).toThrow(
      /belongs to draft 'some-other-draft-id'/,
    );
  });

  it.each([["given-up"], ["rejected"], ["submitted-to-program"]] as const)(
    "throws when the aggregate is '%s' (terminal state)",
    (terminalStatus) => {
      const { aggregate, draft, submission } = seededWithSubmission();
      draft.aggregateStatus = terminalStatus;

      expect(() => aggregate.approveStep({ submission, decidedBy: "u-99" })).toThrow(
        /terminal state/,
      );
    },
  );
});

// ════════════════════════════════════════════════════════════════════════
// requestStepRevisions
// ════════════════════════════════════════════════════════════════════════
describe("ReportDraftAggregate.requestStepRevisions", () => {
  const sampleComment: Parameters<
    InstanceType<typeof ReportDraftAggregate>["requestStepRevisions"]
  >[0]["comments"][number] = {
    body: "Please clarify the impact section.",
    authorId: "u-99",
    authorRole: "mentor",
  };

  it("moves the step status from 'awaiting-review' to 'needs-revision'", () => {
    const { aggregate, draft, submission } = seededWithSubmission();

    aggregate.requestStepRevisions({
      submission,
      decidedBy: "u-99",
      comments: [sampleComment],
    });

    expect(draft.meta.status).toEqual("needs-revision");
  });

  it("stamps the submission with decision='request-changes', decidedAt, decidedBy", () => {
    const { aggregate, submission } = seededWithSubmission(Step.META, {
      clockTicks: [
        "2026-05-14T08:00:00.000Z",
        "2026-05-14T09:00:00.000Z",
        "2026-05-14T10:00:00.000Z",
      ],
    });

    aggregate.requestStepRevisions({
      submission,
      decidedBy: "u-99",
      comments: [sampleComment],
    });

    expect(submission.decision).toEqual("request-changes");
    expect(submission.decidedAt).toEqual("2026-05-14T10:00:00.000Z");
    expect(submission.decidedBy).toEqual("u-99");
  });

  it("returns ReviewerComment[] with fresh ids from the id provider", () => {
    const { aggregate, submission } = seededWithSubmission(Step.META, {
      ids: ["draft-1", "submission-1", "comment-1", "comment-2"],
    });

    const created = aggregate.requestStepRevisions({
      submission,
      decidedBy: "u-99",
      comments: [sampleComment, { ...sampleComment, body: "Second remark." }],
    });

    expect(created).toHaveLength(2);
    expect(created[0].id).toEqual("comment-1");
    expect(created[1].id).toEqual("comment-2");
  });

  it("stamps every returned comment with createdAt = clock.now() at the decision time", () => {
    const { aggregate, submission } = seededWithSubmission(Step.META, {
      clockTicks: [
        "2026-05-14T08:00:00.000Z",
        "2026-05-14T09:00:00.000Z",
        "2026-05-14T10:00:00.000Z",
      ],
    });

    const [created] = aggregate.requestStepRevisions({
      submission,
      decidedBy: "u-99",
      comments: [sampleComment],
    });

    expect(created.createdAt).toEqual("2026-05-14T10:00:00.000Z");
  });

  it("links every returned comment back to the submission via submissionId", () => {
    const { aggregate, submission } = seededWithSubmission();

    const [created] = aggregate.requestStepRevisions({
      submission,
      decidedBy: "u-99",
      comments: [sampleComment],
    });

    expect(created.submissionId).toEqual(submission.id);
  });

  it("preserves the body / authorId / authorRole / anchor passed in", () => {
    const { aggregate, submission } = seededWithSubmission();

    const [created] = aggregate.requestStepRevisions({
      submission,
      decidedBy: "u-99",
      comments: [
        {
          body: "Specific issue here.",
          authorId: "u-77",
          authorRole: "quality_checker",
          anchor: { field: "endpoint", lineStart: 1, lineEnd: 3 },
        },
      ],
    });

    expect(created.body).toEqual("Specific issue here.");
    expect(created.authorId).toEqual("u-77");
    expect(created.authorRole).toEqual("quality_checker");
    expect(created.anchor).toEqual({ field: "endpoint", lineStart: 1, lineEnd: 3 });
  });

  it("bumps version and updatedAt on the draft", () => {
    const { aggregate, draft, submission } = seededWithSubmission(Step.META, {
      clockTicks: [
        "2026-05-14T08:00:00.000Z",
        "2026-05-14T09:00:00.000Z",
        "2026-05-14T10:00:00.000Z",
      ],
    });
    const versionBefore = draft.version;

    aggregate.requestStepRevisions({
      submission,
      decidedBy: "u-99",
      comments: [sampleComment],
    });

    expect(draft.version).toEqual(versionBefore + 1);
    expect(draft.updatedAt).toEqual("2026-05-14T10:00:00.000Z");
  });

  it("throws when the comments array is empty", () => {
    const { aggregate, submission } = seededWithSubmission();

    expect(() =>
      aggregate.requestStepRevisions({
        submission,
        decidedBy: "u-99",
        comments: [],
      }),
    ).toThrow(/at least one comment/);
  });

  it("throws when the step is no longer 'awaiting-review'", () => {
    const { aggregate, draft, submission } = seededWithSubmission();
    draft.meta.status = "in-progress";

    expect(() =>
      aggregate.requestStepRevisions({
        submission,
        decidedBy: "u-99",
        comments: [sampleComment],
      }),
    ).toThrow(/current status is 'in-progress'/);
  });

  it("throws when the submission has already been decided", () => {
    const { aggregate, submission } = seededWithSubmission();
    submission.decision = "request-changes";

    expect(() =>
      aggregate.requestStepRevisions({
        submission,
        decidedBy: "u-99",
        comments: [sampleComment],
      }),
    ).toThrow(/already decided/);
  });

  it("throws when the submission's round is stale", () => {
    const { aggregate, draft, submission } = seededWithSubmission();
    draft.meta.currentRound = submission.round + 1;

    expect(() =>
      aggregate.requestStepRevisions({
        submission,
        decidedBy: "u-99",
        comments: [sampleComment],
      }),
    ).toThrow(/stale round/);
  });

  it.each([["given-up"], ["rejected"], ["submitted-to-program"]] as const)(
    "throws when the aggregate is '%s' (terminal state)",
    (terminalStatus) => {
      const { aggregate, draft, submission } = seededWithSubmission();
      draft.aggregateStatus = terminalStatus;

      expect(() =>
        aggregate.requestStepRevisions({
          submission,
          decidedBy: "u-99",
          comments: [sampleComment],
        }),
      ).toThrow(/terminal state/);
    },
  );
});

// ════════════════════════════════════════════════════════════════════════
// resumeEdit
// ════════════════════════════════════════════════════════════════════════
describe("ReportDraftAggregate.resumeEdit", () => {
  it("moves the step status from 'needs-revision' back to 'in-progress'", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = "needs-revision";
    draft.meta.currentRound = 1;

    aggregate.resumeEdit(Step.META);

    expect(draft.meta.status).toEqual("in-progress");
  });

  it("does NOT bump currentRound (only submit creates a new round)", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = "needs-revision";
    draft.meta.currentRound = 2;

    aggregate.resumeEdit(Step.META);

    expect(draft.meta.currentRound).toEqual(2);
  });

  it("bumps version and updatedAt on the draft", () => {
    const { aggregate, draft } = makeAggregate({
      clockTicks: ["2026-05-14T08:00:00.000Z", "2026-05-14T09:00:00.000Z"],
    });
    draft.meta.status = "needs-revision";
    const versionBefore = draft.version;

    aggregate.resumeEdit(Step.META);

    expect(draft.version).toEqual(versionBefore + 1);
    expect(draft.updatedAt).toEqual("2026-05-14T09:00:00.000Z");
  });

  it.each([
    ["in-progress"],
    ["awaiting-review"],
    ["approved"],
  ] as const)(
    "throws when the step status is '%s' (only 'needs-revision' may be resumed)",
    (status) => {
      const { aggregate, draft } = makeAggregate();
      draft.meta.status = status;

      expect(() => aggregate.resumeEdit(Step.META)).toThrow(
        new RegExp(`current status is '${status}'`),
      );
    },
  );

  it.each([["given-up"], ["rejected"], ["submitted-to-program"]] as const)(
    "throws when the aggregate is '%s' (terminal state)",
    (terminalStatus) => {
      const { aggregate, draft } = makeAggregate();
      draft.meta.status = "needs-revision";
      draft.aggregateStatus = terminalStatus;

      expect(() => aggregate.resumeEdit(Step.META)).toThrow(/terminal state/);
    },
  );
});

// ════════════════════════════════════════════════════════════════════════
// giveUpDraft
// ════════════════════════════════════════════════════════════════════════
describe("ReportDraftAggregate.giveUpDraft", () => {
  it("transitions the aggregate status to 'given-up'", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.giveUpDraft({ byUser: "u-99", byRole: "mentor" });

    expect(draft.aggregateStatus).toEqual("given-up");
  });

  it("bumps version and updatedAt on the draft", () => {
    const { aggregate, draft } = makeAggregate({
      clockTicks: ["2026-05-14T08:00:00.000Z", "2026-05-14T09:00:00.000Z"],
    });
    const versionBefore = draft.version;

    aggregate.giveUpDraft({ byUser: "u-99", byRole: "mentor" });

    expect(draft.version).toEqual(versionBefore + 1);
    expect(draft.updatedAt).toEqual("2026-05-14T09:00:00.000Z");
  });

  it.each([["given-up"], ["rejected"], ["submitted-to-program"]] as const)(
    "throws when the aggregate is already '%s' (terminal state, no double-termination)",
    (terminalStatus) => {
      const { aggregate, draft } = makeAggregate();
      draft.aggregateStatus = terminalStatus;

      expect(() =>
        aggregate.giveUpDraft({ byUser: "u-99", byRole: "mentor" }),
      ).toThrow(/terminal state/);
    },
  );

  it.each([["hunter"], ["mentor"], ["quality_checker"], ["super_admin"]] as const)(
    "allows the '%s' role to give up a draft (peer-review hunters included)",
    (role) => {
      const { aggregate, draft } = makeAggregate();

      aggregate.giveUpDraft({ byUser: "u-99", byRole: role });

      expect(draft.aggregateStatus).toEqual("given-up");
    },
  );
});

// ════════════════════════════════════════════════════════════════════════
// rejectDraft
// ════════════════════════════════════════════════════════════════════════
describe("ReportDraftAggregate.rejectDraft", () => {
  it("transitions the aggregate status to 'rejected'", () => {
    const { aggregate, draft } = makeAggregate();

    aggregate.rejectDraft({ byUser: "u-99", byRole: "quality_checker" });

    expect(draft.aggregateStatus).toEqual("rejected");
  });

  it("bumps version and updatedAt on the draft", () => {
    const { aggregate, draft } = makeAggregate({
      clockTicks: ["2026-05-14T08:00:00.000Z", "2026-05-14T09:00:00.000Z"],
    });
    const versionBefore = draft.version;

    aggregate.rejectDraft({ byUser: "u-99", byRole: "quality_checker" });

    expect(draft.version).toEqual(versionBefore + 1);
    expect(draft.updatedAt).toEqual("2026-05-14T09:00:00.000Z");
  });

  it.each([["given-up"], ["rejected"], ["submitted-to-program"]] as const)(
    "throws when the aggregate is already '%s' (terminal state)",
    (terminalStatus) => {
      const { aggregate, draft } = makeAggregate();
      draft.aggregateStatus = terminalStatus;

      expect(() =>
        aggregate.rejectDraft({ byUser: "u-99", byRole: "quality_checker" }),
      ).toThrow(/terminal state/);
    },
  );

  it.each([["hunter"], ["mentor"], ["quality_checker"], ["super_admin"]] as const)(
    "allows the '%s' role to reject a draft",
    (role) => {
      const { aggregate, draft } = makeAggregate();

      aggregate.rejectDraft({ byUser: "u-99", byRole: role });

      expect(draft.aggregateStatus).toEqual("rejected");
    },
  );
});

describe("ReportDraftAggregate.updateStepPayload", () => {
  it("replaces the payload of an in-progress step", () => {
    const { aggregate, draft } = makeAggregate();
    const next = MetaFactory.create();
    next.reportTitle = "A meaningful title";

    aggregate.updateStepPayload({ step: Step.META, payload: next });

    expect(draft.meta.payload.reportTitle).toEqual("A meaningful title");
  });

  it("leaves the step status, currentRound and assignedReviewerRole untouched", () => {
    const { aggregate, draft } = makeAggregate();
    const next = MetaFactory.create();

    aggregate.updateStepPayload({ step: Step.META, payload: next });

    expect(draft.meta.status).toEqual("in-progress");
    expect(draft.meta.currentRound).toEqual(0);
    expect(draft.meta.assignedReviewerRole).toBeNull();
  });

  it("bumps version and updatedAt on the draft", () => {
    const { aggregate, draft } = makeAggregate({
      clockTicks: ["2026-05-14T08:00:00.000Z", "2026-05-14T09:00:00.000Z"],
    });
    const versionBefore = draft.version;

    aggregate.updateStepPayload({ step: Step.META, payload: MetaFactory.create() });

    expect(draft.version).toEqual(versionBefore + 1);
    expect(draft.updatedAt).toEqual("2026-05-14T09:00:00.000Z");
  });

  it("allows editing a 'needs-revision' step (after a revision round)", () => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = "needs-revision";
    draft.meta.currentRound = 1;
    const next = MetaFactory.create();
    next.reportTitle = "Revised title";

    aggregate.updateStepPayload({ step: Step.META, payload: next });

    expect(draft.meta.payload.reportTitle).toEqual("Revised title");
    expect(draft.meta.status).toEqual("needs-revision");
    expect(draft.meta.currentRound).toEqual(1);
  });

  it.each([
    ["awaiting-review"],
    ["approved"],
  ] as const)("refuses to edit a step in status '%s'", (lockedStatus) => {
    const { aggregate, draft } = makeAggregate();
    draft.meta.status = lockedStatus;

    expect(() =>
      aggregate.updateStepPayload({ step: Step.META, payload: MetaFactory.create() }),
    ).toThrow(/cannot edit step/);
  });

  it.each([["given-up"], ["rejected"], ["submitted-to-program"]] as const)(
    "refuses to edit when the aggregate is '%s' (terminal state)",
    (terminalStatus) => {
      const { aggregate, draft } = makeAggregate();
      draft.aggregateStatus = terminalStatus;

      expect(() =>
        aggregate.updateStepPayload({ step: Step.META, payload: MetaFactory.create() }),
      ).toThrow(/terminal state/);
    },
  );
});
