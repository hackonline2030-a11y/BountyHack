import { ReportDraftDomainModel } from "./report-draft.domain-model";

/** Roles whose review decision unlocks the hunter « Suivant » button (step approval). */
export function isStepValidationReviewerRole(
  role: ReportDraftDomainModel.ReviewerRole,
): boolean {
  return role === "quality_checker" || role === "super_admin";
}
