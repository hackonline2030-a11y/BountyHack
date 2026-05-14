import { InMemoryReportDraftsGateway } from "@modules/report-draft/core/gateway-infra/in-memory.report-drafts.gateway-infra";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";

/**
 * Build a deterministic ReportDraft fixture via the real factory + stubbed
 * providers. The `overrides` field is forwarded to the factory, so callers
 * only specify the few fields they care about for a given assertion.
 *
 * Coupling note: this helper relies on `ReportDraftFactory`. If the
 * factory's defaults change, the fixture changes too — gateway tests stay
 * focused on storage behaviour rather than re-asserting domain defaults.
 */
const buildDraft = (
  overrides: NonNullable<
    Parameters<typeof ReportDraftFactory.create>[0]["overrides"]
  > = {},
): ReportDraftDomainModel.ReportDraft =>
  ReportDraftFactory.create({
    idProvider: new StubIdProvider([overrides.id ?? "draft-1"]),
    clock: new StubClockProvider([overrides.createdAt ?? "2026-05-14T08:00:00.000Z"]),
    hunterId: overrides.hunterId ?? "u-42",
    overrides,
  });

describe("InMemoryReportDraftsGateway (IReportDraftsGateway contract)", () => {
  // ──────────────────────────────────────────────────────────────────────
  // save / findById round-trip
  // ──────────────────────────────────────────────────────────────────────
  it("save + findById round-trip returns an equivalent draft", async () => {
    const repo = new InMemoryReportDraftsGateway();
    const draft = buildDraft({ id: "draft-1" });

    await repo.save(draft);
    const found = await repo.findById("draft-1");

    expect(found).toEqual(draft);
  });

  it("findById returns null for an unknown id", async () => {
    const repo = new InMemoryReportDraftsGateway();

    expect(await repo.findById("does-not-exist")).toBeNull();
  });

  it("save with the same id overwrites the previous version (post-transition save flow)", async () => {
    const repo = new InMemoryReportDraftsGateway();
    await repo.save(buildDraft({ id: "draft-1", version: 0 }));

    await repo.save(buildDraft({ id: "draft-1", version: 5, aggregateStatus: "under-review" }));

    const found = await repo.findById("draft-1");
    expect(found?.version).toEqual(5);
    expect(found?.aggregateStatus).toEqual("under-review");
  });

  // ──────────────────────────────────────────────────────────────────────
  // Isolation — store insulated from caller-side mutations
  // ──────────────────────────────────────────────────────────────────────
  it("save deep-clones the input — later mutations on the original do not leak", async () => {
    const repo = new InMemoryReportDraftsGateway();
    const draft = buildDraft({ id: "draft-1", aggregateStatus: "draft" });

    await repo.save(draft);
    draft.aggregateStatus = "given-up"; // mutate AFTER save

    const found = await repo.findById("draft-1");
    expect(found?.aggregateStatus).toEqual("draft");
  });

  it("findById returns a clone — mutations on the result do not affect the store", async () => {
    const repo = new InMemoryReportDraftsGateway();
    await repo.save(buildDraft({ id: "draft-1", aggregateStatus: "draft" }));

    const first = await repo.findById("draft-1");
    first!.aggregateStatus = "given-up"; // mutate the returned object

    const second = await repo.findById("draft-1");
    expect(second?.aggregateStatus).toEqual("draft");
  });

  // ──────────────────────────────────────────────────────────────────────
  // findByHunterId
  // ──────────────────────────────────────────────────────────────────────
  it("findByHunterId returns only the drafts owned by the given hunter", async () => {
    const repo = new InMemoryReportDraftsGateway();
    await repo.save(buildDraft({ id: "d1", hunterId: "u-42" }));
    await repo.save(buildDraft({ id: "d2", hunterId: "u-99" }));
    await repo.save(buildDraft({ id: "d3", hunterId: "u-42" }));

    const result = await repo.findByHunterId("u-42");

    expect(result.map((d) => d.id).sort()).toEqual(["d1", "d3"]);
  });

  it("findByHunterId sorts by updatedAt DESC (most recently touched first)", async () => {
    const repo = new InMemoryReportDraftsGateway();
    await repo.save(
      buildDraft({ id: "d-oldest", hunterId: "u-42", updatedAt: "2026-05-10T08:00:00.000Z" }),
    );
    await repo.save(
      buildDraft({ id: "d-newest", hunterId: "u-42", updatedAt: "2026-05-14T08:00:00.000Z" }),
    );
    await repo.save(
      buildDraft({ id: "d-middle", hunterId: "u-42", updatedAt: "2026-05-12T08:00:00.000Z" }),
    );

    const result = await repo.findByHunterId("u-42");

    expect(result.map((d) => d.id)).toEqual(["d-newest", "d-middle", "d-oldest"]);
  });

  it("findByHunterId breaks updatedAt ties with id ASC (deterministic)", async () => {
    const repo = new InMemoryReportDraftsGateway();
    const sharedTimestamp = "2026-05-14T08:00:00.000Z";
    await repo.save(buildDraft({ id: "d-c", hunterId: "u-42", updatedAt: sharedTimestamp }));
    await repo.save(buildDraft({ id: "d-a", hunterId: "u-42", updatedAt: sharedTimestamp }));
    await repo.save(buildDraft({ id: "d-b", hunterId: "u-42", updatedAt: sharedTimestamp }));

    const result = await repo.findByHunterId("u-42");

    expect(result.map((d) => d.id)).toEqual(["d-a", "d-b", "d-c"]);
  });

  it("findByHunterId returns an empty array when no draft belongs to the hunter", async () => {
    const repo = new InMemoryReportDraftsGateway();
    await repo.save(buildDraft({ id: "d1", hunterId: "u-99" }));

    expect(await repo.findByHunterId("u-42")).toEqual([]);
  });

  it("findByHunterId returns clones — mutations on the result do not affect the store", async () => {
    const repo = new InMemoryReportDraftsGateway();
    await repo.save(buildDraft({ id: "d1", hunterId: "u-42", aggregateStatus: "draft" }));

    const [first] = await repo.findByHunterId("u-42");
    first.aggregateStatus = "given-up";

    const fresh = await repo.findById("d1");
    expect(fresh?.aggregateStatus).toEqual("draft");
  });
});
