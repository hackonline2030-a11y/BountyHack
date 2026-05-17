import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  stepCommentGroupsFromPayload,
  stepFieldsFromPayload,
} from "@modules/report-draft/core/model/step-field-catalog";

describe("stepCommentGroupsFromPayload", () => {
  it("groups long-form sections with Section 1, Section 2 headings", () => {
    const groups = stepCommentGroupsFromPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      {
        sectionBlocs: [
          { id: "a", heading: "", subheading: "", body: "First body", lists: [] },
          { id: "b", heading: "", subheading: "", body: "Second body", lists: [] },
        ],
      },
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]?.sectionHeading).toBe("Section 1");
    expect(groups[1]?.sectionHeading).toBe("Section 2");
    expect(groups[0]?.fields).toEqual([
      expect.objectContaining({ label: "Paragraphe", value: "First body" }),
    ]);
  });

  it("uses section title in heading when present", () => {
    const groups = stepCommentGroupsFromPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      {
        sectionBlocs: [
          {
            id: "a",
            heading: "Recon",
            subheading: "",
            body: "Details",
            lists: [],
          },
        ],
      },
    );
    expect(groups[0]?.sectionHeading).toBe("Section 1 — Recon");
    expect(groups[0]?.fields.map((f) => f.label)).toEqual(["Titre", "Paragraphe"]);
  });

  it("skips empty sections", () => {
    const groups = stepCommentGroupsFromPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      {
        sectionBlocs: [
          { id: "a", heading: "", subheading: "", body: "", lists: [] },
          { id: "b", heading: "", subheading: "", body: "Only this", lists: [] },
        ],
      },
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.sectionIndex).toBe(2);
    expect(groups[0]?.sectionHeading).toBe("Section 2");
  });

  it("includes list fields when submitted", () => {
    const groups = stepCommentGroupsFromPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      {
        sectionBlocs: [
          {
            id: "a",
            heading: "",
            subheading: "",
            body: "",
            lists: [
              {
                id: "l1",
                ordered: false,
                title: "Points",
                titleBold: false,
                items: ["Alpha"],
              },
            ],
          },
        ],
      },
    );
    expect(groups[0]?.fields).toEqual([
      expect.objectContaining({ label: "Liste — Points", value: "Points\nAlpha" }),
    ]);
  });
});

describe("stepCommentGroupsFromPayload — description", () => {
  it("groups CVSS metrics and free section blocs separately", () => {
    const groups = stepCommentGroupsFromPayload(
      ReportDraftDomainModel.ReportDraftStep.DESCRIPTION,
      {
        attackVector: "N",
        sectionBlocs: [
          { id: "a", heading: "", subheading: "", body: "Contexte", lists: [] },
        ],
      },
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]?.sectionHeading).toBe("Métriques CVSS");
    expect(groups[1]?.sectionHeading).toBe("Section 2");
    expect(groups[1]?.fields[0]?.value).toBe("Contexte");
  });
});

describe("stepFieldsFromPayload", () => {
  it("prefixes flat labels with section heading", () => {
    const rows = stepFieldsFromPayload(
      ReportDraftDomainModel.ReportDraftStep.COLLECTION,
      {
        sectionBlocs: [
          { id: "a", heading: "", subheading: "", body: "Text", lists: [] },
        ],
      },
    );
    expect(rows[0]?.label).toBe("Section 1 — Paragraphe");
  });
});
