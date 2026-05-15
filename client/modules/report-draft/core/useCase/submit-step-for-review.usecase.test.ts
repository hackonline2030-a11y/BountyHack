import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { InMemorySubmissionRepository } from "@modules/report-draft/core/repository-infra/in-memory.submission.repository-infra";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { submitStepForReview } from "@modules/report-draft/core/useCase/submit-step-for-review.usecase";
import { createTestStore } from "@modules/testing/environements";

describe("submitStepForReview use case", () => {
  const HUNTER_ID = "u-42";
  const DRAFT_ID = "draft-1";
  const SUBMISSION_ID = "submission-1";
  const CREATED_AT = "2026-04-01T00:00:00.000Z";
  const SUBMITTED_AT = "2026-04-02T00:00:00.000Z";

  const setup = async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    const submissionRepository = new InMemorySubmissionRepository();
    const draft = ReportDraftFactory.create({
      idProvider: new StubIdProvider([DRAFT_ID]),
      clock: new StubClockProvider([CREATED_AT]),
      hunterId: HUNTER_ID,
    });
    await reportDraftRepository.save(draft);

    const store = createTestStore({
      dependencies: {
        idProvider: new StubIdProvider([SUBMISSION_ID]),
        clock: new StubClockProvider([SUBMITTED_AT]),
        reportDraftRepository,
        submissionRepository,
      },
    });
    return { store, reportDraftRepository, submissionRepository };
  };

  it("flips transition to loading then success", async () => {
    const { store } = await setup();

    const promise = store.dispatch(
      submitStepForReview({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "quality_checker",
        submittedBy: HUNTER_ID,
      }),
    );
    expect(store.getState().reportDrafts.transition).toEqual({ status: "loading" });
    await promise;
    expect(store.getState().reportDrafts.transition).toEqual({ status: "success" });
  });

  it("flips the META step to awaiting-review with round 1 in the slice", async () => {
    const { store } = await setup();

    await store.dispatch(
      submitStepForReview({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "quality_checker",
        submittedBy: HUNTER_ID,
      }),
    );

    const draft = store.getState().reportDrafts.byId[DRAFT_ID];
    expect(draft.meta.status).toBe("awaiting-review");
    expect(draft.meta.currentRound).toBe(1);
    expect(draft.meta.assignedReviewerRole).toBe("quality_checker");
  });

  it("promotes the aggregate from draft to under-review", async () => {
    const { store } = await setup();

    await store.dispatch(
      submitStepForReview({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "quality_checker",
        submittedBy: HUNTER_ID,
      }),
    );

    expect(store.getState().reportDrafts.byId[DRAFT_ID].aggregateStatus).toBe(
      "under-review",
    );
  });

  it("persists the submission in the submissions gateway", async () => {
    const { store, submissionRepository } = await setup();

    await store.dispatch(
      submitStepForReview({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "quality_checker",
        submittedBy: HUNTER_ID,
      }),
    );

    const persisted = await submissionRepository.findById(SUBMISSION_ID);
    expect(persisted).not.toBeNull();
    expect(persisted!.reportDraftId).toBe(DRAFT_ID);
    expect(persisted!.step).toBe(ReportDraftDomainModel.ReportDraftStep.META);
    expect(persisted!.round).toBe(1);
    expect(persisted!.submittedBy).toBe(HUNTER_ID);
    expect(persisted!.decision).toBe("pending");
  });

  it("mirrors the submission into the slice", async () => {
    const { store } = await setup();

    await store.dispatch(
      submitStepForReview({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "quality_checker",
        submittedBy: HUNTER_ID,
      }),
    );

    expect(store.getState().reportDrafts.submissionsById[SUBMISSION_ID]).toBeDefined();
  });

  it("fails the transition when the draft is missing", async () => {
    const { store } = await setup();

    await store.dispatch(
      submitStepForReview({
        draftId: "ghost",
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "quality_checker",
        submittedBy: HUNTER_ID,
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({
      status: "error",
      message: "Draft 'ghost' not found.",
    });
  });

  it("persists an optional payload before creating the submission snapshot", async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    const submissionRepository = new InMemorySubmissionRepository();
    const draft = ReportDraftFactory.create({
      idProvider: new StubIdProvider([DRAFT_ID]),
      clock: new StubClockProvider([CREATED_AT]),
      hunterId: HUNTER_ID,
    });
    await reportDraftRepository.save(draft);

    const store = createTestStore({
      dependencies: {
        idProvider: new StubIdProvider([SUBMISSION_ID]),
        clock: new StubClockProvider([SUBMITTED_AT, SUBMITTED_AT]),
        reportDraftRepository,
        submissionRepository,
      },
    });
    const nextMeta = MetaFactory.create({ reportTitle: "Flushed on submit" });

    await store.dispatch(
      submitStepForReview({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "mentor",
        submittedBy: HUNTER_ID,
        payload: nextMeta,
      }),
    );

    const persisted = await submissionRepository.findById(SUBMISSION_ID);
    const snap = persisted!.payload as ReturnType<typeof MetaFactory.create>;
    expect(snap.reportTitle).toBe("Flushed on submit");
    expect(store.getState().reportDrafts.byId[DRAFT_ID].meta.payload.reportTitle).toBe(
      "Flushed on submit",
    );
  });

  it("surfaces the aggregate guard error when the step is in an illegal status", async () => {
    const { store } = await setup();

    await store.dispatch(
      submitStepForReview({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "quality_checker",
        submittedBy: HUNTER_ID,
      }),
    );
    await store.dispatch(
      submitStepForReview({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        reviewerRole: "quality_checker",
        submittedBy: HUNTER_ID,
      }),
    );

    const transition = store.getState().reportDrafts.transition;
    expect(transition.status).toBe("error");
    if (transition.status === "error") {
      expect(transition.message).toMatch(/cannot submit step/);
    }
  });
});
