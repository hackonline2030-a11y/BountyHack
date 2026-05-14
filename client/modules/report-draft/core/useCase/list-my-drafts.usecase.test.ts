import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftsGateway } from "@modules/report-draft/core/gateway-infra/in-memory.report-drafts.gateway-infra";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { listMyDrafts } from "@modules/report-draft/core/useCase/list-my-drafts.usecase";
import { createTestStore } from "@modules/testing/environements";

describe("listMyDrafts use case", () => {
  const HUNTER_ID = "u-11";

  const seedDrafts = async (
    gateway: InMemoryReportDraftsGateway,
    drafts: ReadonlyArray<{ id: string; createdAt: string; hunterId?: string }>,
  ) => {
    for (const d of drafts) {
      const draft = ReportDraftFactory.create({
        idProvider: new StubIdProvider([d.id]),
        clock: new StubClockProvider([d.createdAt]),
        hunterId: d.hunterId ?? HUNTER_ID,
      });
      await gateway.save(draft);
    }
  };

  it("flips list to loading then success", async () => {
    const reportDraftsGateway = new InMemoryReportDraftsGateway();
    await seedDrafts(reportDraftsGateway, [
      { id: "a", createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const store = createTestStore({ dependencies: { reportDraftsGateway } });

    const promise = store.dispatch(listMyDrafts({ hunterId: HUNTER_ID }));
    expect(store.getState().reportDrafts.list).toEqual({ status: "loading" });
    await promise;
    expect(store.getState().reportDrafts.list).toEqual({ status: "success" });
  });

  it("upserts every returned draft into byId", async () => {
    const reportDraftsGateway = new InMemoryReportDraftsGateway();
    await seedDrafts(reportDraftsGateway, [
      { id: "a", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", createdAt: "2026-01-02T00:00:00.000Z" },
    ]);
    const store = createTestStore({ dependencies: { reportDraftsGateway } });

    await store.dispatch(listMyDrafts({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.byId["a"]).toBeDefined();
    expect(store.getState().reportDrafts.byId["b"]).toBeDefined();
  });

  it("rewrites myDraftIds in gateway order (latest updatedAt first)", async () => {
    const reportDraftsGateway = new InMemoryReportDraftsGateway();
    await seedDrafts(reportDraftsGateway, [
      { id: "old", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "new", createdAt: "2026-03-01T00:00:00.000Z" },
    ]);
    const store = createTestStore({ dependencies: { reportDraftsGateway } });

    await store.dispatch(listMyDrafts({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.myDraftIds).toEqual(["new", "old"]);
  });

  it("filters by hunterId and ignores other hunters' drafts", async () => {
    const reportDraftsGateway = new InMemoryReportDraftsGateway();
    await seedDrafts(reportDraftsGateway, [
      { id: "mine", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "theirs", createdAt: "2026-01-01T00:00:00.000Z", hunterId: "u-99" },
    ]);
    const store = createTestStore({ dependencies: { reportDraftsGateway } });

    await store.dispatch(listMyDrafts({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.myDraftIds).toEqual(["mine"]);
  });

  it("returns an empty list cleanly when the hunter has no draft", async () => {
    const reportDraftsGateway = new InMemoryReportDraftsGateway();
    const store = createTestStore({ dependencies: { reportDraftsGateway } });

    await store.dispatch(listMyDrafts({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.myDraftIds).toEqual([]);
    expect(store.getState().reportDrafts.list).toEqual({ status: "success" });
  });

  it("flips list to error when the gateway throws", async () => {
    const reportDraftsGateway = new InMemoryReportDraftsGateway();
    jest
      .spyOn(reportDraftsGateway, "findByHunterId")
      .mockRejectedValueOnce(new Error("DB outage"));
    const store = createTestStore({ dependencies: { reportDraftsGateway } });

    await store.dispatch(listMyDrafts({ hunterId: HUNTER_ID }));

    expect(store.getState().reportDrafts.list).toEqual({
      status: "error",
      message: "DB outage",
    });
  });
});
