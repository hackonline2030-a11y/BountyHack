import { ReportDraftDomainModel as M } from "./report-draft.domain-model";
import {
  DEFAULT_SECTION_HEADING_FORMAT,
  normalizeSectionHeadingFormat,
} from "./section-bloc-format";

export type SectionBloc = M.SectionBloc;
export type SectionBlocList = M.SectionBlocList;

export function newSectionBlocId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bloc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createEmptySectionBlocList(
  partial?: Partial<Omit<SectionBlocList, "id">> & { id?: string },
): SectionBlocList {
  return {
    id: partial?.id ?? newSectionBlocId(),
    ordered: partial?.ordered ?? false,
    title: partial?.title ?? "",
    titleBold: partial?.titleBold ?? false,
    items: partial?.items ?? [""],
  };
}

export function normalizeSectionBlocLists(raw: unknown): SectionBlocList[] {
  if (!Array.isArray(raw)) return [];
  const out: SectionBlocList[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const items: string[] = [];
    if (Array.isArray(row.items)) {
      for (const li of row.items) {
        if (typeof li === "string") items.push(li);
      }
    }
    out.push(
      createEmptySectionBlocList({
        id: typeof row.id === "string" && row.id.trim() ? row.id : undefined,
        ordered: row.ordered === true,
        title: typeof row.title === "string" ? row.title : "",
        titleBold: row.titleBold === true,
        items: items.length > 0 ? items : [""],
      }),
    );
  }
  return out;
}

export function createEmptySectionBloc(
  partial?: Partial<Omit<SectionBloc, "id">> & { id?: string },
): SectionBloc {
  return {
    id: partial?.id ?? newSectionBlocId(),
    heading: partial?.heading ?? "",
    subheading: partial?.subheading ?? "",
    headingFormat: partial?.headingFormat
      ? normalizeSectionHeadingFormat(partial.headingFormat)
      : { ...DEFAULT_SECTION_HEADING_FORMAT },
    subheadingFormat: partial?.subheadingFormat
      ? normalizeSectionHeadingFormat(partial.subheadingFormat)
      : { ...DEFAULT_SECTION_HEADING_FORMAT },
    body: partial?.body ?? "",
    lists: partial?.lists ? normalizeSectionBlocLists(partial.lists) : [],
    attachmentId:
      partial?.attachmentId === null
        ? null
        : typeof partial?.attachmentId === "string" && partial.attachmentId.trim()
          ? partial.attachmentId
          : null,
  };
}

export function normalizeSectionBlocs(raw: unknown): SectionBloc[] {
  if (!Array.isArray(raw)) return [];
  const out: SectionBloc[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    out.push(
      createEmptySectionBloc({
        id: typeof row.id === "string" && row.id.trim() ? row.id : undefined,
        heading: typeof row.heading === "string" ? row.heading : "",
        subheading: typeof row.subheading === "string" ? row.subheading : "",
        headingFormat: normalizeSectionHeadingFormat(row.headingFormat),
        subheadingFormat: normalizeSectionHeadingFormat(row.subheadingFormat),
        body: typeof row.body === "string" ? row.body : "",
        lists: normalizeSectionBlocLists(row.lists),
        attachmentId:
          typeof row.attachmentId === "string" && row.attachmentId.trim()
            ? row.attachmentId
            : null,
      }),
    );
  }
  return out;
}

export function sectionBlocFieldId(
  blocId: string,
  part: "heading" | "subheading" | "body",
): string {
  return `sectionBlocs.${blocId}.${part}`;
}

export function sectionBlocListFieldId(blocId: string, listId: string): string {
  return `sectionBlocs.${blocId}.lists.${listId}`;
}

const SECTION_PART_LABEL_FR: Record<"heading" | "subheading" | "body", string> = {
  heading: "Titre",
  subheading: "Sous-titre",
  body: "Paragraphe",
};

export function sectionBlocPartLabel(
  bloc: SectionBloc,
  part: "heading" | "subheading" | "body",
  sectionIndex?: number,
): string {
  const section =
    sectionIndex != null
      ? `Section ${sectionIndex}`
      : bloc.heading.trim() || bloc.subheading.trim() || "Section";
  return `${section} — ${SECTION_PART_LABEL_FR[part]}`;
}
