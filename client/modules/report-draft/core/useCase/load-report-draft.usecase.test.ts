import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { InMemoryReviewerCommentRepository } from "@modules/report-draft/core/repository-infra/in-memory.reviewer-comment.repository-infra";
import { InMemorySubmissionRepository } from "@modules/report-draft/core/repository-infra/in-memory.submission.repository-infra";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { loadReportDraft } from "@modules/report-draft/core/useCase/load-report-draft.usecase";
import { createTestStore } from "@modules/testing/environements";

describe("loadReportDraft use case", () => {
  const HUNTER_ID = "u-7";
  const DRAFT_ID = "draft-loaded";

  const setup = async (options?: { seedDraft?: boolean }) => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    if (options?.seedDraft ?? true) {
      const draft = ReportDraftFactory.create({
        idProvider: new StubIdProvider([DRAFT_ID]),
        clock: new StubClockProvider(["2026-02-01T00:00:00.000Z"]),
        hunterId: HUNTER_ID,
      });
      await reportDraftRepository.save(draft);
    }
    const store = createTestStore({ dependencies: { reportDraftRepository } });
    return { store, reportDraftRepository };
  };

  it("flips load to loading while the gateway is fetching", async () => {
    const { store } = await setup();

    const promise = store.dispatch(loadReportDraft({ draftId: DRAFT_ID }));
    expect(store.getState().reportDrafts.load).toEqual({ status: "loading" });

    await promise;
  });

  it("flips load to success once the draft is mirrored in the slice", async () => {
    const { store } = await setup();

    await store.dispatch(loadReportDraft({ draftId: DRAFT_ID }));

    expect(store.getState().reportDrafts.load).toEqual({ status: "success" });
    expect(store.getState().reportDrafts.byId[DRAFT_ID]).toBeDefined();
    expect(store.getState().reportDrafts.byId[DRAFT_ID].hunterId).toBe(HUNTER_ID);
  });

  it("sets the loaded draft as the current draft", async () => {
    const { store } = await setup();

    await store.dispatch(loadReportDraft({ draftId: DRAFT_ID }));

    expect(store.getState().reportDrafts.currentDraftId).toBe(DRAFT_ID);
  });

  it("flips load to error when the draft does not exist", async () => {
    const { store } = await setup({ seedDraft: false });

    await store.dispatch(loadReportDraft({ draftId: "missing" }));

    expect(store.getState().reportDrafts.load).toEqual({
      status: "error",
      message: "Draft 'missing' not found.",
    });
    expect(store.getState().reportDrafts.currentDraftId).toBeNull();
  });

  it("hydrates submissions and reviewer comments into the slice", async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    const submissionRepository = new InMemorySubmissionRepository();
    const reviewerCommentRepository = new InMemoryReviewerCommentRepository();

    const draft = ReportDraftFactory.create({
      idProvider: new StubIdProvider([DRAFT_ID]),
      clock: new StubClockProvider(["2026-02-01T00:00:00.000Z"]),
      hunterId: HUNTER_ID,
    });
    await reportDraftRepository.save(draft);

    const submission: ReportDraftDomainModel.Submission<ReportDraftDomainModel.MetaFields> = {
      id: "sub-1",
      reportDraftId: DRAFT_ID,
      step: ReportDraftDomainModel.ReportDraftStep.META,
      round: 1,
      payload: MetaFactory.create({ reportTitle: "t" }),
      attachmentsSnapshot: [],
      submittedAt: "2026-02-02T00:00:00.000Z",
      submittedBy: HUNTER_ID,
      reviewerRole: "mentor",
      decision: "request-changes",
    };
    await submissionRepository.save(submission);

    await reviewerCommentRepository.saveMany([
      {
        id: "com-1",
        submissionId: "sub-1",
        authorId: "u-mentor",
        authorRole: "mentor",
        body: "Précise le scope.",
        createdAt: "2026-02-02T01:00:00.000Z",
      },
    ]);

    const store = createTestStore({
      dependencies: {
        reportDraftRepository,
        submissionRepository,
        reviewerCommentRepository,
      },
    });

    await store.dispatch(loadReportDraft({ draftId: DRAFT_ID }));

    expect(store.getState().reportDrafts.submissionsById["sub-1"]?.id).toBe("sub-1");
    expect(store.getState().reportDrafts.commentsById["com-1"]?.body).toBe("Précise le scope.");
  });

  it("flips load to error when the gateway throws", async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    jest
      .spyOn(reportDraftRepository, "findById")
      .mockRejectedValueOnce(new Error("DB outage"));
    const store = createTestStore({ dependencies: { reportDraftRepository } });

    await store.dispatch(loadReportDraft({ draftId: DRAFT_ID }));

    expect(store.getState().reportDrafts.load).toEqual({
      status: "error",
      message: "DB outage",
    });
  });
});
