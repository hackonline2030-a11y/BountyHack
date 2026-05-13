/** Placeholder workflow — adjust step names and rules when the real bug-bounty flow is defined. */
export namespace ReportDraftDomainModel {
  export enum ReportDraftStep {
    META = 0,
    DESCRIPTION = 1,
    COLLECTION = 2,
    EXPLOITATION = 3,
    PROOF_OF_CONCEPT = 4,
    RISKS = 5,
    REMEDIATION = 6,
    FINAL = 7,
  }

  /**
   * Structured payload for the META step. Each field is a plain string so the
   * shape stays trivially serialisable for the JSON snapshot that the
   * Puppeteer backend will later consume.
   *
   * The required-fields rule lives in `MetaForm.isSubmitable` (single source
   * of truth — keep it there if you tweak which fields are mandatory).
   */
  export type MetaFields = {
    bugType: string;
    scopeSlug: string;
    endpoint: string;
    vulnerablePartCategory: string;
    vulnerablePartName: string;
    payload: string;
    technicalEnvironment: string;
    applicationFingerprint: string;
    cve: string;
    impact: string;
    ipsUsed: string;
  };

  /**
   * Structured payload for the DESCRIPTION step — the 8 CVSS 3.1 base
   * metrics, each stored as the single-character notation from the CVSS
   * vector spec (`AV` ∈ {N, A, L, P}, etc.).
   *
   * The CVSS vector / score / severity displayed in the UI are derived
   * from these 8 values via `cvssVector`, `cvssBaseScore`, `cvssSeverity`
   * in `core/cvss/cvss-3.1.ts` — they are never persisted.
   *
   * The required-fields rule lives in `DescriptionForm.isSubmitable`
   * (currently `attackVector` + `privilegesRequired` only).
   */
  export type DescriptionFields = {
    attackVector: string;
    attackComplexity: string;
    privilegesRequired: string;
    userInteraction: string;
    scope: string;
    confidentiality: string;
    integrity: string;
    availability: string;
  };
}
