import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { resumeEdit } from "@modules/report-draft/core/useCase/resume-edit.usecase";
import { createTestStore } from "@modules/testing/environements";

/**
 * Seeds a draft whose META step has been submitted, reviewed and sent
 * back as `needs-revision` — the exact precondition for `resumeEdit`.
 */
const seedDraftNeedsRevisionOnMeta = async (
  repository: InMemoryReportDraftRepository,
  draftId: string,
  hunterId: string,
) => {
  const draft = ReportDraftFactory.create({
    idProvider: new StubIdProvider([draftId]),
    clock: new StubClockProvider(["2026-01-01T00:00:00.000Z"]),
    hunterId,
  });
  const aggregate = new ReportDraftAggregate(draft, {
    idProvider: new StubIdProvider(["sub-seed", "comment-seed"]),
    clock: new StubClockProvider([
      "2026-01-02T00:00:00.000Z",
      "2026-01-03T00:00:00.000Z",
    ]),
  });
  const submission = aggregate.submitStepForReview({
    step: ReportDraftDomainModel.ReportDraftStep.META,
    reviewerRole: "quality_checker",
    submittedBy: hunterId,
  });
  aggregate.requestStepRevisions({
    submission,
    decidedBy: "u-99",
    comments: [
      { body: "fix me", authorId: "u-99", authorRole: "quality_checker", anchor: undefined },
    ],
  });
  await repository.save(aggregate.state);
};

describe("resumeEdit use case", () => {
  const HUNTER_ID = "u-42";
  const DRAFT_ID = "draft-1";

  it("flips transition to success and the META step back to in-progress", async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    await seedDraftNeedsRevisionOnMeta(reportDraftRepository, DRAFT_ID, HUNTER_ID);
    const store = createTestStore({ dependencies: { reportDraftRepository } });

    await store.dispatch(
      resumeEdit({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({ status: "success" });
    expect(store.getState().reportDrafts.byId[DRAFT_ID].meta.status).toBe(
      "in-progress",
    );
  });

  it("does not bump the currentRound counter", async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    await seedDraftNeedsRevisionOnMeta(reportDraftRepository, DRAFT_ID, HUNTER_ID);
    const store = createTestStore({ dependencies: { reportDraftRepository } });

    await store.dispatch(
      resumeEdit({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
      }),
    );

    expect(store.getState().reportDrafts.byId[DRAFT_ID].meta.currentRound).toBe(1);
  });

  it("fails the transition when the draft is missing", async () => {
    const store = createTestStore();

    await store.dispatch(
      resumeEdit({
        draftId: "ghost",
        step: ReportDraftDomainModel.ReportDraftStep.META,
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({
      status: "error",
      message: "Draft 'ghost' not found.",
    });
  });

  it("surfaces the aggregate guard error when the step is not awaiting revision", async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    const fresh = ReportDraftFactory.create({
      idProvider: new StubIdProvider([DRAFT_ID]),
      clock: new StubClockProvider(["2026-01-01T00:00:00.000Z"]),
      hunterId: HUNTER_ID,
    });
    await reportDraftRepository.save(fresh);
    const store = createTestStore({ dependencies: { reportDraftRepository } });

    await store.dispatch(
      resumeEdit({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
      }),
    );

    const transition = store.getState().reportDrafts.transition;
    expect(transition.status).toBe("error");
    if (transition.status === "error") {
      expect(transition.message).toMatch(/cannot resume editing/);
    }
  });
});
