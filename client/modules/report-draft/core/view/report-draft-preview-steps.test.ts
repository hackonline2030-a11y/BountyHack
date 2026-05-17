import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import {
  cumulativeStepsForHunter,
  cumulativeStepsForReview,
  payloadResolverForReview,
} from "@modules/report-draft/core/view/report-draft-preview-steps";

describe("report-draft-preview-steps", () => {
  const draft = ReportDraftFactory.create({
    idProvider: new StubIdProvider(["d1"]),
    clock: new StubClockProvider(["2026-01-01T00:00:00.000Z"]),
    hunterId: "h1",
  });
  draft.collection.status = "approved";
  draft.collection.payload = {
    sectionBlocs: [{ id: "b1", heading: "", subheading: "", body: "draft", lists: [] }],
  };

  it("cumulativeStepsForHunter includes steps up to cursor", () => {
    const steps = cumulativeStepsForHunter(ReportDraftDomainModel.ReportDraftStep.COLLECTION);
    expect(steps).toContain(ReportDraftDomainModel.ReportDraftStep.META);
    expect(steps).toContain(ReportDraftDomainModel.ReportDraftStep.COLLECTION);
    expect(steps).not.toContain(ReportDraftDomainModel.ReportDraftStep.EXPLOITATION);
  });

  it("cumulativeStepsForReview includes approved and submission step", () => {
    const steps = cumulativeStepsForReview(
      draft,
      ReportDraftDomainModel.ReportDraftStep.EXPLOITATION,
    );
    expect(steps).toContain(ReportDraftDomainModel.ReportDraftStep.META);
    expect(steps).toContain(ReportDraftDomainModel.ReportDraftStep.COLLECTION);
    expect(steps).toContain(ReportDraftDomainModel.ReportDraftStep.EXPLOITATION);
    expect(steps).not.toContain(ReportDraftDomainModel.ReportDraftStep.DESCRIPTION);
  });

  it("payloadResolverForReview uses submission snapshot for current step", () => {
    const resolve = payloadResolverForReview(
      draft,
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      { sectionBlocs: [{ id: "b1", heading: "", subheading: "", body: "submitted", lists: [] }] },
    );
    const payload = resolve(ReportDraftDomainModel.ReportDraftStep.COLLECTION) as {
      sectionBlocs: { body: string }[];
    };
    expect(payload.sectionBlocs[0]?.body).toBe("submitted");
  });
});
