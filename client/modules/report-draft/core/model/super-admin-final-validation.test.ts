import { describe, expect, it } from "@jest/globals";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import {
  canApproveFinalValidation,
  canRequestFinalRevision,
  canWizardNavigateNext,
  countStepsEligibleForGlobalSubmit,
  isSuperAdminGlobalRevisionMode,
} from "@modules/report-draft/core/model/super-admin-final-validation";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

const clock = { now: () => "2026-05-17T12:00:00.000Z" };
const idProvider = { next: () => "draft-test" };

describe("super-admin final validation helpers", () => {
  it("canApprove when ready-to-program, final approved, no revision flag", () => {
    const draft = ReportDraftFactory.create({ idProvider, clock, hunterId: "h1" });
    draft.aggregateStatus = "ready-to-program";
    draft.final.status = "approved";
    expect(canApproveFinalValidation(draft)).toBe(true);
  });

  it("still approves after a prior revision cycle when ready again", () => {
    const draft = ReportDraftFactory.create({ idProvider, clock, hunterId: "h1" });
    draft.aggregateStatus = "ready-to-program";
    draft.final.status = "approved";
    draft.superAdminRevisionRequestedAt = new Date().toISOString();
    expect(canApproveFinalValidation(draft)).toBe(true);
  });

  it("unlocks wizard navigation during global revision", () => {
    const draft = ReportDraftFactory.create({ idProvider, clock, hunterId: "h1" });
    draft.aggregateStatus = "under-global-review";
    draft.superAdminRevisionRequestedAt = new Date().toISOString();
    expect(isSuperAdminGlobalRevisionMode(draft)).toBe(true);
    expect(canWizardNavigateNext(draft, "in-global-progress")).toBe(true);
    expect(canWizardNavigateNext(draft, "awaiting-global-review")).toBe(true);
  });

  it("allows super-admin to re-open revision when no pending global submission", () => {
    const draft = ReportDraftFactory.create({ idProvider, clock, hunterId: "h1" });
    draft.aggregateStatus = "under-global-review";
    draft.superAdminRevisionRequestedAt = new Date().toISOString();
    draft.superAdminGlobalRevisionCount = 1;
    expect(canRequestFinalRevision(draft, [])).toBe(true);
  });

  it("counts in-global-progress steps as eligible for global submit", () => {
    const draft = ReportDraftFactory.create({ idProvider, clock, hunterId: "h1" });
    draft.aggregateStatus = "under-global-review";
    draft.superAdminRevisionRequestedAt = new Date().toISOString();
    draft.meta.status = "in-global-progress";
    expect(countStepsEligibleForGlobalSubmit(draft, [])).toBeGreaterThan(0);
  });

  it("blocks global submit while a global submission is pending", () => {
    const draft = ReportDraftFactory.create({ idProvider, clock, hunterId: "h1" });
    draft.aggregateStatus = "under-global-review";
    draft.superAdminRevisionRequestedAt = new Date().toISOString();
    draft.superAdminGlobalRevisionCount = 1;
    const pending: ReportDraftDomainModel.GlobalSubmission = {
      id: "gs-1",
      reportDraftId: draft.id,
      revisionNumber: 1,
      payload: {} as ReportDraftDomainModel.GlobalSubmission["payload"],
      submittedAt: new Date().toISOString(),
      submittedBy: "h1",
      reviewerRole: "quality_checker",
      decision: "pending",
    };
    expect(countStepsEligibleForGlobalSubmit(draft, [pending])).toBe(0);
    expect(canRequestFinalRevision(draft, [pending])).toBe(false);
  });
});
