import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  CollectionFactory,
  normalizeLongFormPayload,
} from "@modules/report-draft/core/model/long-form-steps.factory";

describe("normalizeLongFormPayload", () => {
  it("merges a partial object onto defaults", () => {
    const out = normalizeLongFormPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      { hypothesis: "x" },
    );
    expect(out).toEqual(CollectionFactory.create({ hypothesis: "x" }));
  });

  it("maps a legacy single string into the first field", () => {
    const out = normalizeLongFormPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      "legacy prose",
    );
    expect(out.hypothesis).toEqual("legacy prose");
    expect(out.reconNarrative).toEqual("");
  });
});
