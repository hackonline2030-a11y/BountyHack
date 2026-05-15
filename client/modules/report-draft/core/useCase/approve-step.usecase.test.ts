import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { InMemorySubmissionRepository } from "@modules/report-draft/core/repository-infra/in-memory.submission.repository-infra";
import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { approveStep } from "@modules/report-draft/core/useCase/approve-step.usecase";
import { createTestStore } from "@modules/testing/environements";

/**
 * Seeds a draft whose `step` has been submitted for review by the hunter
 * (status: awaiting-review, currentRound: 1) and the matching pending
 * submission, returning the submission id so the test can act on it.
 */
const seedPendingSubmission = async (
  reportDraftRepository: InMemoryReportDraftRepository,
  submissionRepository: InMemorySubmissionRepository,
  options: {
    draftId: string;
    hunterId: string;
    step: ReportDraftDomainModel.ReportDraftStep;
    submissionId: string;
  },
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
    step: options.step,
    reviewerRole: "quality_checker",
    submittedBy: options.hunterId,
  });
  await reportDraftRepository.save(aggregate.state);
  await submissionRepository.save(submission);
};

describe("approveStep use case", () => {
  const HUNTER_ID = "u-42";
  const REVIEWER_ID = "u-99";
  const DRAFT_ID = "draft-1";
  const SUBMISSION_ID = "submission-1";
  const DECIDED_AT = "2026-01-03T00:00:00.000Z";

  const setup = async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    const submissionRepository = new InMemorySubmissionRepository();
    await seedPendingSubmission(reportDraftRepository, submissionRepository, {
      draftId: DRAFT_ID,
      hunterId: HUNTER_ID,
      step: ReportDraftDomainModel.ReportDraftStep.META,
      submissionId: SUBMISSION_ID,
    });

    const store = createTestStore({
      dependencies: {
        clock: new StubClockProvider([DECIDED_AT]),
        reportDraftRepository,
        submissionRepository,
      },
    });
    return { store, reportDraftRepository, submissionRepository };
  };

  it("flips transition to loading then success", async () => {
    const { store } = await setup();

    const promise = store.dispatch(
      approveStep({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
      }),
    );
    expect(store.getState().reportDrafts.transition).toEqual({ status: "loading" });
    await promise;
    expect(store.getState().reportDrafts.transition).toEqual({ status: "success" });
  });

  it("flips the step to approved in the slice", async () => {
    const { store } = await setup();

    await store.dispatch(
      approveStep({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
      }),
    );

    expect(store.getState().reportDrafts.byId[DRAFT_ID].meta.status).toBe("approved");
  });

  it("updates the submission decision in the gateway and the slice", async () => {
    const { store, submissionRepository } = await setup();

    await store.dispatch(
      approveStep({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
      }),
    );

    const persisted = await submissionRepository.findById(SUBMISSION_ID);
    expect(persisted!.decision).toBe("approve");
    expect(persisted!.decidedBy).toBe(REVIEWER_ID);
    expect(persisted!.decidedAt).toBe(DECIDED_AT);
    expect(store.getState().reportDrafts.submissionsById[SUBMISSION_ID].decision).toBe(
      "approve",
    );
  });

  it("fails the transition when the draft is missing", async () => {
    const { store } = await setup();

    await store.dispatch(
      approveStep({
        draftId: "ghost",
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
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
      approveStep({
        draftId: DRAFT_ID,
        submissionId: "ghost-submission",
        decidedBy: REVIEWER_ID,
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({
      status: "error",
      message: "Submission 'ghost-submission' not found.",
    });
  });

  it("refuses to approve a submission that was already decided", async () => {
    const { store } = await setup();

    await store.dispatch(
      approveStep({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
      }),
    );
    await store.dispatch(
      approveStep({
        draftId: DRAFT_ID,
        submissionId: SUBMISSION_ID,
        decidedBy: REVIEWER_ID,
      }),
    );

    const transition = store.getState().reportDrafts.transition;
    expect(transition.status).toBe("error");
    if (transition.status === "error") {
      expect(transition.message).toMatch(/already decided/);
    }
  });
});
