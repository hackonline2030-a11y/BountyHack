import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export function reviewerRoleLabelFr(
  role: ReportDraftDomainModel.ReviewerRole,
): string {
  switch (role) {
    case "mentor":
      return "Mentor";
    case "quality_checker":
      return "Quality checker";
    case "hunter":
      return "Hunter";
    case "super_admin":
      return "Super admin";
    default:
      return role;
  }
}
