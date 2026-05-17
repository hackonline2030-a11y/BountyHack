import {
  DEFAULT_SECTION_HEADING_FORMAT,
  normalizeSectionHeadingFormat,
  sectionHeadingFormatClassName,
} from "@modules/report-draft/core/model/section-bloc-format";

describe("section-bloc-format", () => {
  it("defaults invalid format", () => {
    expect(normalizeSectionHeadingFormat(null)).toEqual(DEFAULT_SECTION_HEADING_FORMAT);
  });

  it("builds class names from style and size", () => {
    expect(
      sectionHeadingFormatClassName({
        style: "bold",
        fontSize: "large",
        color: "#000000",
      }),
    ).toContain("font-bold");
    expect(
      sectionHeadingFormatClassName({
        style: "italic",
        fontSize: "small",
        color: "#000000",
      }),
    ).toContain("italic");
  });
});
