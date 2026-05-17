import { ReportDraftDomainModel as M } from "./report-draft.domain-model";

export const DEFAULT_SECTION_HEADING_FORMAT: M.SectionHeadingFormat = {
  style: "normal",
  fontSize: "medium",
  color: "#1e293b",
};

const FONT_SIZE_CLASS: Record<M.SectionFontSize, string> = {
  small: "text-sm",
  medium: "text-base",
  large: "text-xl",
  huge: "text-2xl",
};

export function sectionHeadingFormatClassName(
  format: M.SectionHeadingFormat,
): string {
  const parts = [FONT_SIZE_CLASS[format.fontSize] ?? FONT_SIZE_CLASS.medium];
  if (format.style === "italic") parts.push("italic");
  if (format.style === "bold") parts.push("font-bold");
  else if (format.style === "normal") parts.push("font-normal");
  return parts.join(" ");
}

export function sectionHeadingFormatStyle(
  format: M.SectionHeadingFormat,
): { color: string } {
  const color = format.color?.trim();
  return { color: color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_SECTION_HEADING_FORMAT.color };
}

export function normalizeSectionHeadingFormat(raw: unknown): M.SectionHeadingFormat {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SECTION_HEADING_FORMAT };
  }
  const row = raw as Record<string, unknown>;
  const style =
    row.style === "italic" || row.style === "bold" || row.style === "normal"
      ? row.style
      : DEFAULT_SECTION_HEADING_FORMAT.style;
  const fontSize =
    row.fontSize === "small" ||
    row.fontSize === "medium" ||
    row.fontSize === "large" ||
    row.fontSize === "huge"
      ? row.fontSize
      : DEFAULT_SECTION_HEADING_FORMAT.fontSize;
  const color =
    typeof row.color === "string" && row.color.trim() ? row.color.trim() : DEFAULT_SECTION_HEADING_FORMAT.color;
  return { style, fontSize, color };
}
