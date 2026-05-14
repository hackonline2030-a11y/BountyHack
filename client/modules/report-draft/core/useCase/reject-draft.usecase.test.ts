import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftsGateway } from "@modules/report-draft/core/gateway-infra/in-memory.report-drafts.gateway-infra";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { rejectDraft } from "@modules/report-draft/core/useCase/reject-draft.usecase";
import { createTestStore } from "@modules/testing/environements";

describe("rejectDraft use case", () => {
  const HUNTER_ID = 42;
  const DRAFT_ID = "draft-1";

  const setup = async () => {
    const reportDraftsGateway = new InMemoryReportDraftsGateway();
    const draft = ReportDraftFactory.create({
      idProvider: new StubIdProvider([DRAFT_ID]),
      clock: new StubClockProvider(["2026-01-01T00:00:00.000Z"]),
      hunterId: HUNTER_ID,
    });
    await reportDraftsGateway.save(draft);
    const store = createTestStore({ dependencies: { reportDraftsGateway } });
    return { store, reportDraftsGateway };
  };

  it("flips transition to success and the aggregate status to rejected", async () => {
    const { store } = await setup();

    await store.dispatch(
      rejectDraft({ draftId: DRAFT_ID, byUser: 99, byRole: "quality_checker" }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({ status: "success" });
    expect(store.getState().reportDrafts.byId[DRAFT_ID].aggregateStatus).toBe(
      "rejected",
    );
  });

  it("persists the terminal status through the gateway", async () => {
    const { store, reportDraftsGateway } = await setup();

    await store.dispatch(
      rejectDraft({ draftId: DRAFT_ID, byUser: 99, byRole: "mentor" }),
    );

    const persisted = await reportDraftsGateway.findById(DRAFT_ID);
    expect(persisted!.aggregateStatus).toBe("rejected");
  });

  it("fails the transition when the draft is missing", async () => {
    const store = createTestStore();

    await store.dispatch(
      rejectDraft({ draftId: "ghost", byUser: 99, byRole: "quality_checker" }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({
      status: "error",
      message: "Draft 'ghost' not found.",
    });
  });

  it("refuses to reject a draft already in a terminal state", async () => {
    const { store } = await setup();

    await store.dispatch(
      rejectDraft({ draftId: DRAFT_ID, byUser: 99, byRole: "quality_checker" }),
    );
    await store.dispatch(
      rejectDraft({ draftId: DRAFT_ID, byUser: 99, byRole: "quality_checker" }),
    );

    const transition = store.getState().reportDrafts.transition;
    expect(transition.status).toBe("error");
    if (transition.status === "error") {
      expect(transition.message).toMatch(/terminal state/);
    }
  });
});
