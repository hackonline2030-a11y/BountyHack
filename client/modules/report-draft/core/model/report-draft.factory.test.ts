import {
  ReportDraftFactory,
  type CreateReportDraftDeps,
} from "@modules/report-draft/core/model/report-draft.factory";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";
import { DescriptionFactory } from "@modules/report-draft/core/model/description.factory";
import {
  CollectionFactory,
  ExploitationFactory,
  FinalFactory,
  ProofOfConceptFactory,
  RemediationFactory,
  RisksFactory,
} from "@modules/report-draft/core/model/long-form-steps.factory";

/**
 * Builds a `CreateReportDraftDeps` with sensible defaults so each test
 * only spells out what its own assertion cares about.
 */
const makeDeps = (
  overrides?: Partial<CreateReportDraftDeps>,
): CreateReportDraftDeps => ({
  idProvider: new StubIdProvider(),
  clock: new StubClockProvider(),
  hunterId: "u-42",
  ...overrides,
});

describe("ReportDraftFactory", () => {
  // ──────────────────────────────────────────────────────────────────────
  // id / version
  // ──────────────────────────────────────────────────────────────────────
  it("uses the id from the provider", () => {
    const draft = ReportDraftFactory.create(
      makeDeps({ idProvider: new StubIdProvider(["draft-1"]) }),
    );

    expect(draft.id).toEqual("draft-1");
  });

  it("uses a fresh id for each draft", () => {
    const provider = new StubIdProvider(["a", "b"]);

    expect(ReportDraftFactory.create(makeDeps({ idProvider: provider })).id).toEqual("a");
    expect(ReportDraftFactory.create(makeDeps({ idProvider: provider })).id).toEqual("b");
  });

  it("starts at version 0", () => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft.version).toEqual(0);
  });

  it("can be created with a specific version (restore from storage)", () => {
    const draft = ReportDraftFactory.create(
      makeDeps({ overrides: { id: "x", version: 5 } }),
    );

    expect(draft.id).toEqual("x");
    expect(draft.version).toEqual(5);
  });

  it("can be restored with a specific id (overrides take precedence over the provider)", () => {
    const draft = ReportDraftFactory.create(
      makeDeps({
        idProvider: new StubIdProvider(["unused"]),
        overrides: { id: "restored-42", version: 0 },
      }),
    );

    expect(draft.id).toEqual("restored-42");
  });

  // ──────────────────────────────────────────────────────────────────────
  // ownership + aggregate status + timestamps
  // ──────────────────────────────────────────────────────────────────────
  it("assigns the draft to the hunter who created it", () => {
    const draft = ReportDraftFactory.create(makeDeps({ hunterId: "u-7" }));

    expect(draft.hunterId).toEqual("u-7");
  });

  it("starts in 'draft' aggregate status (editable, not yet under review)", () => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft.aggregateStatus).toEqual("draft");
  });

  it("stamps createdAt from the clock provider", () => {
    const draft = ReportDraftFactory.create(
      makeDeps({ clock: new StubClockProvider(["2026-05-14T20:00:00.000Z"]) }),
    );

    expect(draft.createdAt).toEqual("2026-05-14T20:00:00.000Z");
  });

  it("starts with updatedAt equal to createdAt (no edit has happened yet)", () => {
    const draft = ReportDraftFactory.create(
      makeDeps({ clock: new StubClockProvider(["2026-05-14T20:00:00.000Z"]) }),
    );

    expect(draft.updatedAt).toEqual(draft.createdAt);
  });

  // ──────────────────────────────────────────────────────────────────────
  // META step
  // ──────────────────────────────────────────────────────────────────────
  it("starts META with an empty payload (no bug-type, no scope, no payload, etc.)", () => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft.meta.payload).toEqual(MetaFactory.create());
  });

  it("starts META in the 'in-progress' state (hunter is editing, no submission yet)", () => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft.meta.status).toEqual("in-progress");
  });

  it("starts META at round 0 (no submission for review yet)", () => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft.meta.currentRound).toEqual(0);
  });

  it("starts META with no reviewer assigned (assignment happens on submit)", () => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft.meta.assignedReviewerRole).toBeNull();
  });

  it("starts META with no attachments (no screenshot/video uploaded yet)", () => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft.meta.attachments).toEqual([]);
  });

  it("can be restored with a specific meta (overrides take precedence)", () => {
    const draft = ReportDraftFactory.create(
      makeDeps({ overrides: { meta: MetaFactory.create({ bugType: "XSS" }) } }),
    );

    expect(draft.meta.payload.bugType).toEqual("XSS");
  });

  // ──────────────────────────────────────────────────────────────────────
  // DESCRIPTION step (CVSS metrics)
  // ──────────────────────────────────────────────────────────────────────
  it("starts DESCRIPTION with an empty CVSS payload (no metric selected yet)", () => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft.description.payload).toEqual(DescriptionFactory.create());
  });

  it("can be restored with a specific description (overrides take precedence)", () => {
    const draft = ReportDraftFactory.create(
      makeDeps({
        overrides: { description: DescriptionFactory.create({ attackVector: "N" }) },
      }),
    );

    expect(draft.description.payload.attackVector).toEqual("N");
  });

  // ──────────────────────────────────────────────────────────────────────
  // The 6 structured long-form steps (COLLECTION → FINAL)
  // ──────────────────────────────────────────────────────────────────────
  it.each([
    ["collection", CollectionFactory.create()],
    ["exploitation", ExploitationFactory.create()],
    ["proofOfConcept", ProofOfConceptFactory.create()],
    ["risks", RisksFactory.create()],
    ["remediation", RemediationFactory.create()],
    ["final", FinalFactory.create()],
  ] as const)("starts %s with an empty structured payload", (stepKey, emptyShape) => {
    const draft = ReportDraftFactory.create(makeDeps());

    expect(draft[stepKey].payload).toEqual(emptyShape);
  });

  it("can be restored with specific long-form step payloads (overrides take precedence)", () => {
    const draft = ReportDraftFactory.create(
      makeDeps({
        overrides: {
          collection: CollectionFactory.create({
            sectionBlocs: [
              {
                id: "b1",
                heading: "Collecte",
                subheading: "",
                body: "C",
                attachmentId: null,
              },
            ],
          }),
          exploitation: ExploitationFactory.create({ prerequisites: "E" }),
          proofOfConcept: ProofOfConceptFactory.create({ environment: "P" }),
          risks: RisksFactory.create({ confidentiality: "R" }),
          remediation: RemediationFactory.create({ shortTermMitigation: "RM" }),
          final: FinalFactory.create({ conclusion: "F" }),
        },
      }),
    );

    expect(draft.collection.payload.sectionBlocs[0]?.body).toBe("C");
    expect(draft.exploitation.payload).toEqual(ExploitationFactory.create({ prerequisites: "E" }));
    expect(draft.proofOfConcept.payload).toEqual(ProofOfConceptFactory.create({ environment: "P" }));
    expect(draft.risks.payload).toEqual(RisksFactory.create({ confidentiality: "R" }));
    expect(draft.remediation.payload).toEqual(
      RemediationFactory.create({ shortTermMitigation: "RM" }),
    );
    expect(draft.final.payload).toEqual(FinalFactory.create({ conclusion: "F" }));
  });
});
