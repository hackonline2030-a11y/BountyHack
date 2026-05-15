import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { giveUpDraft } from "@modules/report-draft/core/useCase/give-up-draft.usecase";
import { createTestStore } from "@modules/testing/environements";

describe("giveUpDraft use case", () => {
  const HUNTER_ID = "u-42";
  const DRAFT_ID = "draft-1";

  const setup = async () => {
    const reportDraftRepository = new InMemoryReportDraftRepository();
    const draft = ReportDraftFactory.create({
      idProvider: new StubIdProvider([DRAFT_ID]),
      clock: new StubClockProvider(["2026-01-01T00:00:00.000Z"]),
      hunterId: HUNTER_ID,
    });
    await reportDraftRepository.save(draft);
    const store = createTestStore({ dependencies: { reportDraftRepository } });
    return { store, reportDraftRepository };
  };

  it("flips transition to success and the aggregate status to given-up", async () => {
    const { store } = await setup();

    await store.dispatch(
      giveUpDraft({ draftId: DRAFT_ID, byUser: "u-99", byRole: "quality_checker" }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({ status: "success" });
    expect(store.getState().reportDrafts.byId[DRAFT_ID].aggregateStatus).toBe(
      "given-up",
    );
  });

  it("persists the terminal status through the gateway", async () => {
    const { store, reportDraftRepository } = await setup();

    await store.dispatch(
      giveUpDraft({ draftId: DRAFT_ID, byUser: HUNTER_ID, byRole: "hunter" }),
    );

    const persisted = await reportDraftRepository.findById(DRAFT_ID);
    expect(persisted!.aggregateStatus).toBe("given-up");
  });

  it("fails the transition when the draft is missing", async () => {
    const store = createTestStore();

    await store.dispatch(
      giveUpDraft({ draftId: "ghost", byUser: "u-99", byRole: "quality_checker" }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({
      status: "error",
      message: "Draft 'ghost' not found.",
    });
  });

  it("refuses a second give-up on a draft already in a terminal state", async () => {
    const { store } = await setup();

    await store.dispatch(
      giveUpDraft({ draftId: DRAFT_ID, byUser: "u-99", byRole: "quality_checker" }),
    );
    await store.dispatch(
      giveUpDraft({ draftId: DRAFT_ID, byUser: "u-99", byRole: "quality_checker" }),
    );

    const transition = store.getState().reportDrafts.transition;
    expect(transition.status).toBe("error");
    if (transition.status === "error") {
      expect(transition.message).toMatch(/terminal state/);
    }
  });
});
