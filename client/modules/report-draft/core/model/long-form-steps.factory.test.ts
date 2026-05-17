import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  CollectionFactory,
  normalizeLongFormPayload,
} from "@modules/report-draft/core/model/long-form-steps.factory";

describe("normalizeLongFormPayload", () => {
  it("returns empty sectionBlocs by default", () => {
    const out = normalizeLongFormPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      undefined,
    );
    expect(out).toEqual(CollectionFactory.create());
  });

  it("normalizes sectionBlocs array", () => {
    const out = normalizeLongFormPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      {
        sectionBlocs: [
          {
            id: "b1",
            heading: "Recon",
            subheading: "",
            body: "Details",
            attachmentId: null,
          },
        ],
      },
    );
    expect(out.sectionBlocs).toHaveLength(1);
    expect(out.sectionBlocs[0]?.heading).toBe("Recon");
    expect(out.sectionBlocs[0]?.body).toBe("Details");
  });

  it("migrates legacy flat fields into section blocs", () => {
    const out = normalizeLongFormPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      { hypothesis: "x", reconNarrative: "y" },
    );
    expect(out.sectionBlocs).toHaveLength(2);
    expect(out.sectionBlocs[0]?.heading).toBe("Hypothèse de travail");
    expect(out.sectionBlocs[0]?.body).toBe("x");
    expect(out.sectionBlocs[1]?.body).toBe("y");
  });

  it("maps a legacy single string into one section bloc", () => {
    const out = normalizeLongFormPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      "legacy prose",
    );
    expect(out.sectionBlocs).toHaveLength(1);
    expect(out.sectionBlocs[0]?.body).toBe("legacy prose");
  });

  it("normalizes heading format and lists on section blocs", () => {
    const out = normalizeLongFormPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      {
        sectionBlocs: [
          {
            id: "b1",
            heading: "Titre",
            headingFormat: { style: "bold", fontSize: "large", color: "#ff0000" },
            body: "Texte",
            lists: [
              {
                id: "l1",
                ordered: true,
                title: "Étapes",
                titleBold: true,
                items: ["Un", "Deux"],
              },
            ],
          },
        ],
      },
    );
    const bloc = out.sectionBlocs[0];
    expect(bloc?.headingFormat.style).toBe("bold");
    expect(bloc?.headingFormat.fontSize).toBe("large");
    expect(bloc?.lists).toHaveLength(1);
    expect(bloc?.lists[0]?.ordered).toBe(true);
    expect(bloc?.lists[0]?.items).toEqual(["Un", "Deux"]);
  });
});
