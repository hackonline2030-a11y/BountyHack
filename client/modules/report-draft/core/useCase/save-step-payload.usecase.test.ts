import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftsGateway } from "@modules/report-draft/core/gateway-infra/in-memory.report-drafts.gateway-infra";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { saveStepPayload } from "@modules/report-draft/core/useCase/save-step-payload.usecase";
import { createTestStore } from "@modules/testing/environements";

describe("saveStepPayload use case", () => {
  const HUNTER_ID = "u-42";
  const DRAFT_ID = "draft-1";
  const SAVED_AT = "2026-05-15T00:00:00.000Z";

  const setup = async () => {
    const reportDraftsGateway = new InMemoryReportDraftsGateway();
    const draft = ReportDraftFactory.create({
      idProvider: new StubIdProvider([DRAFT_ID]),
      clock: new StubClockProvider(["2026-05-14T00:00:00.000Z"]),
      hunterId: HUNTER_ID,
    });
    await reportDraftsGateway.save(draft);
    const store = createTestStore({
      dependencies: {
        clock: new StubClockProvider([SAVED_AT]),
        reportDraftsGateway,
      },
    });
    return { store, reportDraftsGateway };
  };

  it("persists the new META payload (gateway + slice)", async () => {
    const { store, reportDraftsGateway } = await setup();
    const nextMeta = MetaFactory.create();
    nextMeta.reportTitle = "My fresh title";

    await store.dispatch(
      saveStepPayload({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        payload: nextMeta,
      }),
    );

    const persisted = await reportDraftsGateway.findById(DRAFT_ID);
    expect(persisted!.meta.payload.reportTitle).toBe("My fresh title");
    expect(store.getState().reportDrafts.byId[DRAFT_ID].meta.payload.reportTitle).toBe(
      "My fresh title",
    );
  });

  it("bumps version and updatedAt", async () => {
    const { store } = await setup();

    await store.dispatch(
      saveStepPayload({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        payload: MetaFactory.create(),
      }),
    );

    const draft = store.getState().reportDrafts.byId[DRAFT_ID];
    expect(draft.version).toBe(1);
    expect(draft.updatedAt).toBe(SAVED_AT);
  });

  it("does not transition the step status", async () => {
    const { store } = await setup();

    await store.dispatch(
      saveStepPayload({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        payload: MetaFactory.create(),
      }),
    );

    const draft = store.getState().reportDrafts.byId[DRAFT_ID];
    expect(draft.meta.status).toBe("in-progress");
    expect(draft.meta.currentRound).toBe(0);
  });

  it("flips transition to success", async () => {
    const { store } = await setup();

    await store.dispatch(
      saveStepPayload({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        payload: MetaFactory.create(),
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({ status: "success" });
  });

  it("fails the transition when the draft is missing", async () => {
    const { store } = await setup();

    await store.dispatch(
      saveStepPayload({
        draftId: "ghost",
        step: ReportDraftDomainModel.ReportDraftStep.META,
        payload: MetaFactory.create(),
      }),
    );

    expect(store.getState().reportDrafts.transition).toEqual({
      status: "error",
      message: "Draft 'ghost' not found.",
    });
  });

  it("surfaces the aggregate guard error when the step is locked", async () => {
    const { store, reportDraftsGateway } = await setup();
    const draft = (await reportDraftsGateway.findById(DRAFT_ID))!;
    draft.meta.status = "approved";
    await reportDraftsGateway.save(draft);

    await store.dispatch(
      saveStepPayload({
        draftId: DRAFT_ID,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        payload: MetaFactory.create(),
      }),
    );

    const transition = store.getState().reportDrafts.transition;
    expect(transition.status).toBe("error");
    if (transition.status === "error") {
      expect(transition.message).toMatch(/cannot edit step/);
    }
  });
});
