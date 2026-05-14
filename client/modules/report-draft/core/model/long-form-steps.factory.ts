import { ReportDraftDomainModel as M } from "./report-draft.domain-model";

export class CollectionFactory {
  static create(data?: Partial<M.CollectionFields>): M.CollectionFields {
    return {
      hypothesis: "",
      reconNarrative: "",
      endpointsAndParameters: "",
      evidenceSummary: "",
      ...data,
    };
  }
}

export class ExploitationFactory {
  static create(data?: Partial<M.ExploitationFields>): M.ExploitationFields {
    return {
      prerequisites: "",
      attackPath: "",
      exploitationNarrative: "",
      impactIfExploited: "",
      ...data,
    };
  }
}

export class ProofOfConceptFactory {
  static create(data?: Partial<M.ProofOfConceptFields>): M.ProofOfConceptFields {
    return {
      environment: "",
      stepsToReproduce: "",
      proofArtifactsDescription: "",
      expectedBehavior: "",
      ...data,
    };
  }
}

export class RisksFactory {
  static create(data?: Partial<M.RisksFields>): M.RisksFields {
    return {
      confidentiality: "",
      integrity: "",
      availability: "",
      overallRiskStatement: "",
      ...data,
    };
  }
}

export class RemediationFactory {
  static create(data?: Partial<M.RemediationFields>): M.RemediationFields {
    return {
      shortTermMitigation: "",
      longTermFix: "",
      verificationSteps: "",
      ...data,
    };
  }
}

export class FinalFactory {
  static create(data?: Partial<M.FinalFields>): M.FinalFields {
    return {
      conclusion: "",
      references: "",
      bugBountyNotes: "",
      ...data,
    };
  }
}

export type LongFormWizardStep = Exclude<
  M.ReportDraftStep,
  M.ReportDraftStep.META | M.ReportDraftStep.DESCRIPTION
>;

export function emptyPayloadForStep(step: M.ReportDraftStep): Record<string, string> {
  const Step = M.ReportDraftStep;
  switch (step) {
    case Step.COLLECTION:
      return CollectionFactory.create();
    case Step.EXPLOITATION:
      return ExploitationFactory.create();
    case Step.PROOF_OF_CONCEPT:
      return ProofOfConceptFactory.create();
    case Step.RISKS:
      return RisksFactory.create();
    case Step.REMEDIATION:
      return RemediationFactory.create();
    case Step.FINAL:
      return FinalFactory.create();
    default:
      throw new Error(`emptyPayloadForStep: step ${step} is not a long-form wizard step`);
  }
}

/**
 * Bridges legacy drafts that stored a single Markdown string per step into
 * the structured shape (first field receives the prose).
 */
export function normalizeLongFormPayload(step: M.ReportDraftStep, raw: unknown): Record<string, string> {
  const defaults = emptyPayloadForStep(step);
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...defaults, ...(raw as Record<string, string>) };
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    const keys = Object.keys(defaults);
    const first = keys[0];
    if (first === undefined) return defaults;
    return { ...defaults, [first]: raw };
  }
  return defaults;
}
