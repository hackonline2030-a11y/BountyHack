import { ReportDraftDomainModel as M } from "./report-draft.domain-model";

export type SectionBloc = M.SectionBloc;

export function newSectionBlocId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bloc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createEmptySectionBloc(
  partial?: Partial<Omit<SectionBloc, "id">> & { id?: string },
): SectionBloc {
  return {
    id: partial?.id ?? newSectionBlocId(),
    heading: partial?.heading ?? "",
    subheading: partial?.subheading ?? "",
    body: partial?.body ?? "",
    attachmentId: partial?.attachmentId ?? null,
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
        body: typeof row.body === "string" ? row.body : "",
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

export function sectionBlocPartLabel(
  bloc: SectionBloc,
  part: "heading" | "subheading" | "body",
): string {
  const title = bloc.heading.trim() || bloc.subheading.trim() || "Section sans titre";
  const partLabel =
    part === "heading"
      ? "titre"
      : part === "subheading"
        ? "sous-titre"
        : "contenu";
  return `${title} (${partLabel})`;
}
