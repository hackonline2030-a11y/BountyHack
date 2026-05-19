import { ReportDraftDomainModel as M } from "@modules/report-draft/core/model/report-draft.domain-model";
import { normalizeLongFormPayload } from "@modules/report-draft/core/model/long-form-steps.factory";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";
import { normalizeDescriptionPayload } from "@modules/report-draft/core/model/description.factory";
import { sectionBlocsHaveSubmittedContent } from "@modules/report-draft/core/model/section-bloc";
import { cvssBaseScore } from "@modules/report-draft/core/cvss/cvss-3.1";
import { reviewerDisplayNameFromTeam } from "@modules/report-draft/core/view/hunter-draft-review-activity";

export type PdfTocEntry = {
  label: string;
  page: number;
  bold?: boolean;
};

/** Titres de chapitres alignés sur le PDF final (ex. rapport YWH), pas les libellés d’étapes du wizard. */
export const PDF_CHAPTER_TITLE_FR: Partial<Record<M.ReportDraftStep, string>> = {
  [M.ReportDraftStep.DESCRIPTION]: "Description du challenge",
  [M.ReportDraftStep.COLLECTION]: "Collectes d'informations",
  [M.ReportDraftStep.EXPLOITATION]: "Exploitation",
  [M.ReportDraftStep.PROOF_OF_CONCEPT]: "PoC",
  [M.ReportDraftStep.RISKS]: "Risque",
  [M.ReportDraftStep.REMEDIATION]: "Remédiation",
  [M.ReportDraftStep.FINAL]: "Finalisation",
};

export function pdfChapterTitle(step: M.ReportDraftStep): string | null {
  return PDF_CHAPTER_TITLE_FR[step] ?? null;
}

export function stepHasPdfChapterContent(step: M.ReportDraftStep, payload: unknown): boolean {
  switch (step) {
    case M.ReportDraftStep.META:
      return false;
    case M.ReportDraftStep.DESCRIPTION: {
      const desc = normalizeDescriptionPayload(payload);
      return (
        cvssBaseScore(desc) != null || sectionBlocsHaveSubmittedContent(desc.sectionBlocs)
      );
    }
    default: {
      const { sectionBlocs } = normalizeLongFormPayload(step, payload);
      return sectionBlocs.some(
        (b) =>
          b.heading.trim() ||
          b.subheading.trim() ||
          b.body.trim() ||
          b.lists.some(
            (l) => l.title.trim() || l.items.some((i) => i.trim().length > 0),
          ),
      );
    }
  }
}

export function reportTitleFromDraft(
  draft: M.ReportDraft,
  metaPayload: unknown,
): string {
  const meta = MetaFactory.create(
    metaPayload && typeof metaPayload === "object"
      ? (metaPayload as Partial<M.MetaFields>)
      : undefined,
  );
  return (
    meta.reportTitle?.trim() ||
    draft.reportTeam?.label?.trim() ||
    "Rapport de sécurité"
  );
}

/** Nom affiché sur la page de garde (« par … ») — propriétaire du brouillon / hunter. */
export function authorNameFromDraft(draft: M.ReportDraft): string {
  const owner = draft.reportTeam?.members.find((m) => m.userId === draft.hunterId);
  if (owner?.displayName?.trim()) {
    return owner.displayName.trim();
  }
  const hunterRole = draft.reportTeam?.members.find((m) =>
    (m.role ?? "").toLowerCase().includes("hunter"),
  );
  if (hunterRole?.displayName?.trim()) {
    return hunterRole.displayName.trim();
  }
  return reviewerDisplayNameFromTeam(draft, draft.hunterId);
}

/** Sommaire type PDF : uniquement les chapitres, la page de garde porte déjà le titre. */
export function buildPdfTableOfContents(chapterLabels: readonly string[]): PdfTocEntry[] {
  const entries: PdfTocEntry[] = [];
  let page = 2;
  for (const label of chapterLabels) {
    entries.push({
      label: label.endsWith(":") ? label : `${label} :`,
      page,
    });
    page += 1;
  }
  return entries;
}
