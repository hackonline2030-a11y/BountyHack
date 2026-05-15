import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { reconcileDraftStepStatusFromSubmissions } from "@modules/report-draft/core/useCase/reconcile-draft-from-submissions";

describe("reconcileDraftStepStatusFromSubmissions", () => {
  it("sets needs-revision when latest submission requested changes but step stayed awaiting-review", () => {
    const draft = ReportDraftFactory.create({
      idProvider: { next: () => "draft-1" },
      clock: { now: () => "2026-05-15T10:00:00.000Z" },
      hunterId: "hunter-1",
    });
    draft.meta.status = "awaiting-review";
    draft.meta.currentRound = 1;

    const reconciled = reconcileDraftStepStatusFromSubmissions(draft, [
      {
        id: "sub-1",
        reportDraftId: draft.id,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        round: 1,
        payload: {},
        attachmentsSnapshot: [],
        submittedAt: "2026-05-15T11:00:00.000Z",
        submittedBy: "hunter-1",
        reviewerRole: "quality_checker",
        decision: "request-changes",
        decidedAt: "2026-05-15T12:00:00.000Z",
        decidedBy: "qc-1",
      },
    ]);

    expect(reconciled.meta.status).toBe("needs-revision");
  });
});
