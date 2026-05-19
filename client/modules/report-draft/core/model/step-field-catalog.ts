import { ReportDraftDomainModel as M } from "./report-draft.domain-model";
import { normalizeDescriptionPayload } from "./description.factory";
import { normalizeLongFormPayload } from "./long-form-steps.factory";
import {
  sectionBlocFieldId,
  sectionBlocListFieldId,
  type SectionBloc,
  type SectionBlocList,
} from "./section-bloc";

export type StepFieldRow = {
  fieldId: string;
  label: string;
  value: string;
};

/** Comment targets grouped like the submitted preview (Section 1, 2, …). */
export type StepSectionCommentGroup = {
  sectionIndex: number;
  sectionHeading: string;
  fields: StepFieldRow[];
};

const META_LABELS: Record<keyof M.MetaFields, string> = {
  reportTitle: "Titre du rapport",
  bugType: "Type de bug",
  scopeSlug: "Scope",
  endpoint: "Endpoint",
  vulnerablePartCategory: "Vulnerable part — catégorie",
  vulnerablePartName: "Vulnerable part — nom",
  payload: "Payload",
  technicalEnvironment: "Environnement technique",
  applicationFingerprint: "Application fingerprint",
  cve: "CVE",
  impact: "Impact",
  ipsUsed: "IPs utilisées",
};

type DescriptionCvssKey = Exclude<keyof M.DescriptionFields, "sectionBlocs">;

const DESCRIPTION_CVSS_LABELS: Record<DescriptionCvssKey, string> = {
  attackVector: "Attack Vector (AV)",
  attackComplexity: "Attack Complexity (AC)",
  privilegesRequired: "Privileges Required (PR)",
  userInteraction: "User Interaction (UI)",
  scope: "Scope (S)",
  confidentiality: "Confidentiality (C)",
  integrity: "Integrity (I)",
  availability: "Availability (A)",
};

function listPreview(list: SectionBlocList): string {
  const items = list.items.filter((i) => i.trim().length > 0);
  const title = list.title.trim();
  const parts: string[] = [];
  if (title) parts.push(title);
  if (items.length > 0) parts.push(items.join(" · "));
  return parts.join("\n");
}

function listFieldLabel(list: SectionBlocList): string {
  if (list.title.trim()) {
    return `Liste — ${list.title.trim()}`;
  }
  return list.ordered ? "Liste numérotée" : "Liste à puces";
}

function sectionHasSubmittedContent(bloc: SectionBloc): boolean {
  if (bloc.heading.trim() || bloc.subheading.trim() || bloc.body.trim()) {
    return true;
  }
  return bloc.lists.some(
    (l) => l.title.trim() || l.items.some((i) => i.trim().length > 0),
  );
}

function fieldsForSectionBloc(bloc: SectionBloc): StepFieldRow[] {
  const rows: StepFieldRow[] = [];

  if (bloc.heading.trim()) {
    rows.push({
      fieldId: sectionBlocFieldId(bloc.id, "heading"),
      label: "Titre",
      value: bloc.heading,
    });
  }
  if (bloc.subheading.trim()) {
    rows.push({
      fieldId: sectionBlocFieldId(bloc.id, "subheading"),
      label: "Sous-titre",
      value: bloc.subheading,
    });
  }
  if (bloc.body.trim()) {
    rows.push({
      fieldId: sectionBlocFieldId(bloc.id, "body"),
      label: "Paragraphe",
      value: bloc.body,
    });
  }
  for (const list of bloc.lists) {
    const hasContent =
      list.title.trim() || list.items.some((i) => i.trim().length > 0);
    if (!hasContent) continue;
    rows.push({
      fieldId: sectionBlocListFieldId(bloc.id, list.id),
      label: listFieldLabel(list),
      value: listPreview(list),
    });
  }
  return rows;
}

function sectionHeadingLabel(bloc: SectionBloc, sectionIndex: number): string {
  const title = bloc.heading.trim();
  return title ? `Section ${sectionIndex} — ${title}` : `Section ${sectionIndex}`;
}

function sectionGroupsFromSectionBlocs(
  sectionBlocs: SectionBloc[],
  sectionIndexOffset = 0,
): StepSectionCommentGroup[] {
  const groups: StepSectionCommentGroup[] = [];

  sectionBlocs.forEach((bloc, index) => {
    if (!sectionHasSubmittedContent(bloc)) return;
    const fields = fieldsForSectionBloc(bloc);
    if (fields.length === 0) return;
    const sectionIndex = index + 1 + sectionIndexOffset;
    groups.push({
      sectionIndex,
      sectionHeading: sectionHeadingLabel(bloc, sectionIndex),
      fields,
    });
  });

  return groups;
}

function longFormSectionGroupsFromPayload(
  step: M.ReportDraftStep,
  payload: unknown,
): StepSectionCommentGroup[] {
  const { sectionBlocs } = normalizeLongFormPayload(step, payload);
  return sectionGroupsFromSectionBlocs(sectionBlocs);
}

function flatFieldsWithValues(
  labels: Record<string, string>,
  values: Record<string, string>,
): StepFieldRow[] {
  return Object.entries(labels)
    .map(([fieldId, label]) => ({
      fieldId,
      label,
      value: values[fieldId] ?? "",
    }))
    .filter((row) => row.value.trim().length > 0);
}

export const STEP_TITLE_FR: Record<M.ReportDraftStep, string> = {
  [M.ReportDraftStep.META]: "Métadonnées",
  [M.ReportDraftStep.DESCRIPTION]: "Description",
  [M.ReportDraftStep.COLLECTION]: "Collecte",
  [M.ReportDraftStep.EXPLOITATION]: "Exploitation",
  [M.ReportDraftStep.PROOF_OF_CONCEPT]: "Preuve de concept",
  [M.ReportDraftStep.RISKS]: "Risques",
  [M.ReportDraftStep.REMEDIATION]: "Remédiation",
  [M.ReportDraftStep.FINAL]: "Finalisation",
};

export const STEP_TITLE_EN: Record<M.ReportDraftStep, string> = {
  [M.ReportDraftStep.META]: "Metadata",
  [M.ReportDraftStep.DESCRIPTION]: "Description",
  [M.ReportDraftStep.COLLECTION]: "Collection",
  [M.ReportDraftStep.EXPLOITATION]: "Exploitation",
  [M.ReportDraftStep.PROOF_OF_CONCEPT]: "Proof of concept",
  [M.ReportDraftStep.RISKS]: "Risks",
  [M.ReportDraftStep.REMEDIATION]: "Remediation",
  [M.ReportDraftStep.FINAL]: "Finalization",
};

/**
 * Comment targets for reviewer boards — grouped by section for long-form steps.
 */
export function stepCommentGroupsFromPayload(
  step: M.ReportDraftStep,
  payload: unknown,
): StepSectionCommentGroup[] {
  switch (step) {
    case M.ReportDraftStep.META: {
      const p = payload as M.MetaFields;
      const fields = flatFieldsWithValues(
        META_LABELS as Record<string, string>,
        p as unknown as Record<string, string>,
      );
      return fields.length > 0
        ? [{ sectionIndex: 1, sectionHeading: STEP_TITLE_FR[M.ReportDraftStep.META], fields }]
        : [];
    }
    case M.ReportDraftStep.DESCRIPTION: {
      const p = normalizeDescriptionPayload(payload);
      const groups: StepSectionCommentGroup[] = [];
      const cvssFields = flatFieldsWithValues(
        DESCRIPTION_CVSS_LABELS as Record<string, string>,
        p as unknown as Record<string, string>,
      );
      if (cvssFields.length > 0) {
        groups.push({
          sectionIndex: 1,
          sectionHeading: "Métriques CVSS",
          fields: cvssFields,
        });
      }
      groups.push(...sectionGroupsFromSectionBlocs(p.sectionBlocs, groups.length));
      return groups;
    }
    default:
      return longFormSectionGroupsFromPayload(step, payload);
  }
}

/** Flat list (legacy); only non-empty submitted values. */
export function stepFieldsFromPayload(
  step: M.ReportDraftStep,
  payload: unknown,
): StepFieldRow[] {
  return stepCommentGroupsFromPayload(step, payload).flatMap((g) =>
    g.fields.map((f) => ({
      ...f,
      label: `${g.sectionHeading} — ${f.label}`,
    })),
  );
}

export function stepFieldLabelFromGroups(
  groups: readonly StepSectionCommentGroup[],
  fieldId: string,
): string {
  for (const group of groups) {
    const field = group.fields.find((f) => f.fieldId === fieldId);
    if (field) {
      return `${group.sectionHeading} — ${field.label}`;
    }
  }
  return fieldId;
}
