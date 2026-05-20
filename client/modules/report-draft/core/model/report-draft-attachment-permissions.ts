import { AppRoleCode } from "@/lib/app-role-code";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";

export function canDeleteReportDraftAttachment(input: {
  viewerUserId: string;
  roleCode: string | null;
  draft: ReportDraftDomainModel.ReportDraft | undefined;
  step: ReportDraftDomainModel.ReportDraftStep;
  submissions: ReadonlyArray<ReportDraftDomainModel.Submission<unknown>>;
}): boolean {
  const { viewerUserId, roleCode, draft, step, submissions } = input;
  if (!draft) return false;
  if (roleCode === AppRoleCode.SUPER_ADMIN) return true;
  const writerId = draft.hunterWriterId ?? draft.hunterId;
  if (roleCode === AppRoleCode.HUNTER && viewerUserId === writerId) return true;
  if (roleCode === AppRoleCode.QUALITY_CHECKER) {
    return submissions.some(
      (s) =>
        s.reportDraftId === draft.id &&
        s.step === step &&
        s.reviewerRole === "quality_checker" &&
        s.decision === "pending",
    );
  }
  return false;
}

/** Steps that may hold section-bloc image attachments. */
export function stepSupportsAttachments(
  step: ReportDraftDomainModel.ReportDraftStep,
): boolean {
  return reportDraftStepToStateKey(step) !== "meta";
}
