import { ReportDraftDomainModel as M } from "./report-draft.domain-model";
import {
  createEmptySectionBloc,
  normalizeSectionBlocs,
} from "./section-bloc";

export type LongFormWizardStep = Exclude<
  M.ReportDraftStep,
  M.ReportDraftStep.META | M.ReportDraftStep.DESCRIPTION
>;

/** Legacy flat field keys per step (import migration only). */
const LEGACY_FIELDS_BY_STEP: Record<LongFormWizardStep, ReadonlyArray<{ key: string; heading: string }>> = {
  [M.ReportDraftStep.COLLECTION]: [
    { key: "hypothesis", heading: "Hypothèse de travail" },
    { key: "reconNarrative", heading: "Collecte et reconnaissance" },
    { key: "endpointsAndParameters", heading: "Endpoints, paramètres et entrées observés" },
    { key: "evidenceSummary", heading: "Synthèse des éléments collectés" },
  ],
  [M.ReportDraftStep.EXPLOITATION]: [
    { key: "prerequisites", heading: "Prérequis (auth, rôle, configuration…)" },
    { key: "attackPath", heading: "Chemin d’attaque" },
    { key: "exploitationNarrative", heading: "Scénario d’exploitation" },
    { key: "impactIfExploited", heading: "Impact si exploité" },
  ],
  [M.ReportDraftStep.PROOF_OF_CONCEPT]: [
    { key: "environment", heading: "Environnement de test" },
    { key: "stepsToReproduce", heading: "Étapes de reproduction" },
    { key: "proofArtifactsDescription", heading: "Requêtes, payloads, captures (texte)" },
    { key: "expectedBehavior", heading: "Comportement attendu vs observé" },
  ],
  [M.ReportDraftStep.RISKS]: [
    { key: "confidentiality", heading: "Risque pour la confidentialité" },
    { key: "integrity", heading: "Risque pour l’intégrité" },
    { key: "availability", heading: "Risque pour la disponibilité" },
    { key: "overallRiskStatement", heading: "Synthèse du risque global" },
  ],
  [M.ReportDraftStep.REMEDIATION]: [
    { key: "shortTermMitigation", heading: "Atténuation court terme" },
    { key: "longTermFix", heading: "Correctif durable" },
    { key: "verificationSteps", heading: "Vérification après correctif" },
  ],
  [M.ReportDraftStep.FINAL]: [
    { key: "conclusion", heading: "Conclusion" },
    { key: "references", heading: "Références (CVE, CWE, liens…)" },
    { key: "bugBountyNotes", heading: "Notes finales / chaîne de bugs" },
  ],
};

export function createLongFormStepPayload(
  data?: Partial<M.LongFormStepPayload>,
): M.LongFormStepPayload {
  return {
    sectionBlocs: data?.sectionBlocs
      ? normalizeSectionBlocs(data.sectionBlocs)
      : [],
  };
}

export class CollectionFactory {
  static create(data?: Partial<M.CollectionFields>): M.CollectionFields {
    return createLongFormStepPayload(data);
  }
}

export class ExploitationFactory {
  static create(data?: Partial<M.ExploitationFields>): M.ExploitationFields {
    return createLongFormStepPayload(data);
  }
}

export class ProofOfConceptFactory {
  static create(data?: Partial<M.ProofOfConceptFields>): M.ProofOfConceptFields {
    return createLongFormStepPayload(data);
  }
}

export class RisksFactory {
  static create(data?: Partial<M.RisksFields>): M.RisksFields {
    return createLongFormStepPayload(data);
  }
}

export class RemediationFactory {
  static create(data?: Partial<M.RemediationFields>): M.RemediationFields {
    return createLongFormStepPayload(data);
  }
}

export class FinalFactory {
  static create(data?: Partial<M.FinalFields>): M.FinalFields {
    return createLongFormStepPayload(data);
  }
}

export function emptyPayloadForStep(step: M.ReportDraftStep): M.LongFormStepPayload {
  return createLongFormStepPayload();
}

function migrateLegacyFlatObject(
  step: LongFormWizardStep,
  obj: Record<string, unknown>,
): M.LongFormStepPayload {
  const blocs: M.SectionBloc[] = [];
  for (const { key, heading } of LEGACY_FIELDS_BY_STEP[step]) {
    const val = obj[key];
    if (typeof val === "string" && val.trim().length > 0) {
      blocs.push(createEmptySectionBloc({ heading, body: val }));
    }
  }
  return { sectionBlocs: blocs };
}

/**
 * Normalizes long-form step payload: `sectionBlocs[]` or legacy flat fields / markdown string.
 */
export function normalizeLongFormPayload(
  step: M.ReportDraftStep,
  raw: unknown,
): M.LongFormStepPayload {
  const empty = createLongFormStepPayload();

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.sectionBlocs)) {
      return { sectionBlocs: normalizeSectionBlocs(obj.sectionBlocs) };
    }
    if (
      step !== M.ReportDraftStep.META &&
      step !== M.ReportDraftStep.DESCRIPTION
    ) {
      return migrateLegacyFlatObject(step as LongFormWizardStep, obj);
    }
    return empty;
  }

  if (typeof raw === "string" && raw.trim().length > 0) {
    return {
      sectionBlocs: [createEmptySectionBloc({ body: raw })],
    };
  }

  return empty;
}
