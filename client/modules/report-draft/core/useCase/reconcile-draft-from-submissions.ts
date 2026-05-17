import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { isGlobalStepStatus } from "@modules/report-draft/core/model/global-step-status";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";

/**
 * When a submission has `request-changes` but the draft step stayed `awaiting-review`
 * (e.g. QC could not persist the draft before the API fix), unlock the hunter UI.
 */
export function reconcileDraftStepStatusFromSubmissions(
  draft: ReportDraftDomainModel.ReportDraft,
  submissions: ReadonlyArray<ReportDraftDomainModel.Submission<unknown>>,
): ReportDraftDomainModel.ReportDraft {
  const next = JSON.parse(JSON.stringify(draft)) as ReportDraftDomainModel.ReportDraft;
  const steps = Object.values(ReportDraftDomainModel.ReportDraftStep).filter(
    (v): v is ReportDraftDomainModel.ReportDraftStep => typeof v === "number",
  );

  for (const step of steps) {
    const forStep = submissions.filter((s) => s.reportDraftId === draft.id && s.step === step);
    if (forStep.length === 0) continue;

    const latest = forStep.reduce((best, current) =>
      current.round >= best.round ? current : best,
    );
    if (latest.decision !== "request-changes") continue;

    const key = reportDraftStepToStateKey(step);
    const stepState = next[key] as ReportDraftDomainModel.StepState<unknown>;
    if (isGlobalStepStatus(stepState.status)) continue;
    if (stepState.status === "awaiting-review") {
      stepState.status = "needs-revision";
    }
  }

  return next;
}
