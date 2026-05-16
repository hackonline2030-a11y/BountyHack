import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { InMemoryReviewerCommentRepository } from "@modules/report-draft/core/repository-infra/in-memory.reviewer-comment.repository-infra";
import { InMemorySubmissionRepository } from "@modules/report-draft/core/repository-infra/in-memory.submission.repository-infra";
import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { requestStepRevisions } from "@modules/report-draft/core/useCase/request-step-revisions.usecase";
import { createTestStore } from "@modules/testing/environements";

const seedPendingSubmission = async (
  reportDraftRepository: InMemoryReportDraftRepository,
  submissionRepository: InMemorySubmissionRepository,
  options: { draftId: string; hunterId: string; submissionId: string },
): Promise<void> => {
  const draft = ReportDraftFactory.create({
    idProvider: new StubIdProvider([options.draftId]),
    clock: new StubClockProvider(["2026-01-01T00:00:00.000Z"]),
    hunterId: options.hunterId,
  });
  const aggregate = new ReportDraftAggregate(draft, {
    idProvider: new StubIdProvider([options.submissionId]),
    clock: new StubClockProvider(["2026-01-02T00:00:00.000Z"]),
  });
  const submission = aggregate.submitStepForReview({
    step: ReportDraftDomainModel.ReportDraftStep.META,
    reviewerRole: "quality_checker",
    submittedBy: options.hunterId,
  });
  await reportDraftRepository.save(aggregate.state);
  await submissionRepository.save(submission);
};

describe("requestStepRevisions use case", () => {
  const HUNTER_ID = "u-42";
  const REVIEWER_ID = "u-99";
  const DRAFT_ID = "draft-1";
  const SUBMISSION_ID = "submission-1";
  const COMMENT_ID_1 = "comment-1";
  const COMMENT_ID_2 = "comment-2";
  const DECIDED_AT = "2026-01-03T00:00:00.000Z";

  const baseComment = {
    body: "Please clarify the scope",
    authorId: REVIEWER_ID,
    authorRole: "quality_checker" as const,
    anchor: undefined,
  };

  const setup = async (options?: { idSequence?: ReadonlyArray<string> }) => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    const submissionRepository = new InMemorySubmissionRepository();
    const reviewerCommentRepository = new InMemoryReviewerCommentRepository();
    await seedPendingSubmission(reportDraftRepository, submissionRepository, {
      draftId: DRAFT_ID,
      hunterId: HUNTER_ID,
      submissionId: SUBMISSION_ID,
    });
    const store = createTestStore({
      dependencies: {
        idProvider: new StubIdProvider(options?.idSequence ?? [COMMENT_ID_1]),
        clock: new StubClockProvider([DECIDED_AT]),
        reportDraftRepository,
        submissionRepository,
        reviewerCommentRepository,
      },
    });
    return { store, reportDraftRepository, submissionRepository, reviewerCommentRepository };
  };

  it("flips transition to success and the step to needs-revision", async () => {
    const { store } = await setup();

    await store.dispatch(
      requestStepRevisions({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
        comments: [baseComment],
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({ status: "success" });
    expect(store.getState().reportDrafts.byId[DRAFT_ID].meta.status).toBe(
      "needs-revision",
    );
  });

  it("marks the submission decision as request-changes (gateway + slice)", async () => {
    const { store, submissionRepository } = await setup();

    await store.dispatch(
      requestStepRevisions({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
        comments: [baseComment],
      }),
    );

    const persisted = await submissionRepository.findById(SUBMISSION_ID);
    expect(persisted!.decision).toBe("request-changes");
    expect(persisted!.decidedBy).toBe(REVIEWER_ID);
    expect(persisted!.decidedAt).toBe(DECIDED_AT);
    expect(
      store.getState().reportDrafts.submissionsById[SUBMISSION_ID].decision,
    ).toBe("request-changes");
  });

  it("persists every comment with a fresh id and the decision timestamp", async () => {
    const { store, reviewerCommentRepository } = await setup({
      idSequence: [COMMENT_ID_1, COMMENT_ID_2],
    });

    await store.dispatch(
      requestStepRevisions({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
        comments: [
          baseComment,
          { ...baseComment, body: "Also rework the title" },
        ],
      }),
    );

    const stored = await reviewerCommentRepository.findBySubmissionId(SUBMISSION_ID);
    expect(stored).toHaveLength(2);
    expect(stored.map((c) => c.id)).toEqual([COMMENT_ID_1, COMMENT_ID_2]);
    expect(stored.every((c) => c.createdAt === DECIDED_AT)).toBe(true);
  });

  it("mirrors the new comments into the slice keyed by id", async () => {
    const { store } = await setup({ idSequence: [COMMENT_ID_1, COMMENT_ID_2] });

    await store.dispatch(
      requestStepRevisions({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
        comments: [baseComment, { ...baseComment, body: "more" }],
      }),
    );

    expect(store.getState().reportDrafts.commentsById[COMMENT_ID_1]).toBeDefined();
    expect(store.getState().reportDrafts.commentsById[COMMENT_ID_2]).toBeDefined();
  });

  it("fails the transition when the draft is missing", async () => {
    const { store } = await setup();

    await store.dispatch(
      requestStepRevisions({
        draftId: "ghost",
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
        comments: [baseComment],
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({
      status: "error",
      message: "Draft 'ghost' not found.",
    });
  });

  it("fails the transition when the submission is missing", async () => {
    const { store } = await setup();

    await store.dispatch(
      requestStepRevisions({
        draftId: DRAFT_ID,
        submissionId: "ghost-sub",
        decidedBy: REVIEWER_ID,
        comments: [baseComment],
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({
      status: "error",
      message: "Submission 'ghost-sub' not found.",
    });
  });

  it("surfaces the aggregate guard error when comments is empty", async () => {
    const { store } = await setup();

    await store.dispatch(
      requestStepRevisions({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
        comments: [],
      }),
    );

    const transition = store.getState().reportDrafts.transition;
    expect(transition.status).toBe("error");
    if (transition.status === "error") {
      expect(transition.message).toMatch(/requires at least one comment/);
    }
  });
});
