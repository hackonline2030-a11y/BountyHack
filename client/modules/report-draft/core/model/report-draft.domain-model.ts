/** Placeholder workflow — adjust step names and rules when the real bug-bounty flow is defined. */
export namespace ReportDraftDomainModel {
  export enum ReportDraftStep {
    DESCRIPTION = 0,
    COLLECTION = 1,
    EXPLOITATION = 2,
    PROOF_OF_CONCEPT = 3,
    RISKS = 4,
    REMEDIATION = 5,
    FINAL = 6,
  }
}
