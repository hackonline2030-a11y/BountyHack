import { ReportDraftDomainModel as M } from "./report-draft.domain-model";
import { normalizeLongFormPayload } from "./long-form-steps.factory";

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

const LONG_FORM_LABELS: Record<
  Exclude<M.ReportDraftStep, M.ReportDraftStep.META | M.ReportDraftStep.DESCRIPTION>,
  Record<string, string>
> = {
  [M.ReportDraftStep.COLLECTION]: {
    hypothesis: "Hypothèse de travail",
    reconNarrative: "Collecte et reconnaissance",
    endpointsAndParameters: "Endpoints, paramètres et entrées observés",
    evidenceSummary: "Synthèse des éléments collectés",
  },
  [M.ReportDraftStep.EXPLOITATION]: {
    prerequisites: "Prérequis",
    attackPath: "Chemin d’attaque",
    exploitationNarrative: "Scénario d’exploitation",
    impactIfExploited: "Impact si exploité",
  },
  [M.ReportDraftStep.PROOF_OF_CONCEPT]: {
    environment: "Environnement de test",
    stepsToReproduce: "Étapes de reproduction",
    proofArtifactsDescription: "Requêtes, payloads, captures",
    expectedBehavior: "Comportement attendu vs observé",
  },
  [M.ReportDraftStep.RISKS]: {
    confidentiality: "Risque — confidentialité",
    integrity: "Risque — intégrité",
    availability: "Risque — disponibilité",
    overallRiskStatement: "Synthèse du risque global",
  },
  [M.ReportDraftStep.REMEDIATION]: {
    shortTermMitigation: "Atténuation court terme",
    longTermFix: "Correctif durable",
    verificationSteps: "Vérification après correctif",
  },
  [M.ReportDraftStep.FINAL]: {
    conclusion: "Conclusion",
    references: "Références",
    bugBountyNotes: "Notes finales",
  },
};

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
      const labels = LONG_FORM_LABELS[step];
      return Object.keys(labels).map((fieldId) => ({
        fieldId,
        label: labels[fieldId] ?? fieldId,
        value: normalized[fieldId] ?? "",
      }));
    }
  }
}
