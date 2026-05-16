import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { createReportDraft } from "@modules/report-draft/core/useCase/create-report-draft.usecase";
import { createTestStore } from "@modules/testing/environements";

describe("createReportDraft use case", () => {
  const HUNTER_ID = "u-42";
  const DRAFT_ID = "draft-1";
  const CREATED_AT = "2026-01-01T10:00:00.000Z";

  const setup = (overrides?: {
    idSequence?: ReadonlyArray<string>;
    clockSequence?: ReadonlyArray<string>;
    repository?: InMemoryReportDraftRepository;
  }) => {
    const reportDraftRepository = overrides?.repository ?? new InMemoryReportDraftRepository();
    const store = createTestStore({
      dependencies: {
        idProvider: new StubIdProvider(overrides?.idSequence ?? [DRAFT_ID]),
        clock: new StubClockProvider(overrides?.clockSequence ?? [CREATED_AT]),
        reportDraftRepository,
      },
    });
    return { store, reportDraftRepository };
  };

  it("flips the creation state to loading while the gateway is saving", async () => {
    const { store } = setup();

    const promise = store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.creation).toEqual({ status: "loading" });

    await promise;
  });

  it("flips the creation state to success with the new draft id once persisted", async () => {
    const { store } = setup();

    await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.creation).toEqual({
      status: "success",
      draftId: DRAFT_ID,
    });
  });

  it("persists the freshly built draft through the report-drafts gateway", async () => {
    const { store, reportDraftRepository } = setup();

    await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    const persisted = await reportDraftRepository.findById(DRAFT_ID);
    expect(persisted).not.toBeNull();
    expect(persisted!.id).toBe(DRAFT_ID);
    expect(persisted!.hunterId).toBe(HUNTER_ID);
    expect(persisted!.aggregateStatus).toBe("draft");
    expect(persisted!.version).toBe(0);
    expect(persisted!.createdAt).toBe(CREATED_AT);
    expect(persisted!.updatedAt).toBe(CREATED_AT);
  });

  it("mirrors the persisted draft into the slice under byId", async () => {
    const { store } = setup();

    await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    const { byId } = store.getState().reportDrafts;
    expect(byId[DRAFT_ID]).toBeDefined();
    expect(byId[DRAFT_ID].hunterId).toBe(HUNTER_ID);
    expect(byId[DRAFT_ID].aggregateStatus).toBe("draft");
  });

  it("marks the newly created draft as the wizard's current draft", async () => {
    const { store } = setup();

    await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.currentDraftId).toBe(DRAFT_ID);
  });

  it("initializes every step in the in-progress status", async () => {
    const { store } = setup();

    await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    const draft = store.getState().reportDrafts.byId[DRAFT_ID];
    const stepKeys = [
      "meta",
      "description",
      "collection",
      "exploitation",
      "proofOfConcept",
      "risks",
      "remediation",
      "final",
    ] as const;
    for (const key of stepKeys) {
      expect(draft[key].status).toBe("in-progress");
      expect(draft[key].currentRound).toBe(0);
      expect(draft[key].assignedReviewerRole).toBeNull();
      expect(draft[key].attachments).toEqual([]);
    }
  });

  it("flips the creation state to error when the gateway throws", async () => {
    const brokenGateway = new InMemoryReportDraftRepository();
    jest.spyOn(brokenGateway, "save").mockRejectedValueOnce(new Error("DB is down"));
    const { store } = setup({ repository: brokenGateway });

    await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.creation).toEqual({
      status: "error",
      message: "DB is down",
    });
  });

  it("does not insert a draft into the slice when persistence fails", async () => {
    const brokenGateway = new InMemoryReportDraftRepository();
    jest.spyOn(brokenGateway, "save").mockRejectedValueOnce(new Error("DB is down"));
    const { store } = setup({ repository: brokenGateway });

    await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.byId).toEqual({});
    expect(store.getState().reportDrafts.currentDraftId).toBeNull();
  });

  it("returns the newly created draft id on success", async () => {
    const { store } = setup();

    const result = await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    expect(result).toBe(DRAFT_ID);
  });

  it("returns null when persistence fails", async () => {
    const brokenGateway = new InMemoryReportDraftRepository();
    jest.spyOn(brokenGateway, "save").mockRejectedValueOnce(new Error("DB is down"));
    const { store } = setup({ repository: brokenGateway });

    const result = await store.dispatch(createReportDraft({ hunterId: HUNTER_ID }));

    expect(result).toBeNull();
  });
});
