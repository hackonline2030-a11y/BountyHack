import { ReportDraftDomainModel as M } from "./report-draft.domain-model";
import { normalizeLongFormPayload } from "./long-form-steps.factory";
import {
  sectionBlocFieldId,
  sectionBlocPartLabel,
} from "./section-bloc";

export type StepFieldRow = {
  fieldId: string;
  label: string;
  value: string;
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

const DESCRIPTION_LABELS: Record<keyof M.DescriptionFields, string> = {
  attackVector: "Attack Vector (AV)",
  attackComplexity: "Attack Complexity (AC)",
  privilegesRequired: "Privileges Required (PR)",
  userInteraction: "User Interaction (UI)",
  scope: "Scope (S)",
  confidentiality: "Confidentiality (C)",
  integrity: "Integrity (I)",
  availability: "Availability (A)",
};

function longFormFieldsFromPayload(payload: unknown): StepFieldRow[] {
  const normalized =
    typeof payload === "object" && payload !== null && "sectionBlocs" in payload
      ? (payload as M.LongFormStepPayload)
      : { sectionBlocs: [] as M.SectionBloc[] };

  const rows: StepFieldRow[] = [];
  for (const bloc of normalized.sectionBlocs) {
    for (const part of ["heading", "subheading", "body"] as const) {
      rows.push({
        fieldId: sectionBlocFieldId(bloc.id, part),
        label: sectionBlocPartLabel(bloc, part),
        value: bloc[part],
      });
    }
  }
  return rows;
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

export function stepFieldsFromPayload(
  step: M.ReportDraftStep,
  payload: unknown,
): StepFieldRow[] {
  switch (step) {
    case M.ReportDraftStep.META: {
      const p = payload as M.MetaFields;
      return (Object.keys(META_LABELS) as Array<keyof M.MetaFields>).map((key) => ({
        fieldId: key,
        label: META_LABELS[key],
        value: p[key] ?? "",
      }));
    }
    case M.ReportDraftStep.DESCRIPTION: {
      const p = payload as M.DescriptionFields;
      return (Object.keys(DESCRIPTION_LABELS) as Array<keyof M.DescriptionFields>).map(
        (key) => ({
          fieldId: key,
          label: DESCRIPTION_LABELS[key],
          value: p[key] ?? "",
        }),
      );
    }
    default: {
      const normalized = normalizeLongFormPayload(step, payload);
      return longFormFieldsFromPayload(normalized);
    }
  }
}
