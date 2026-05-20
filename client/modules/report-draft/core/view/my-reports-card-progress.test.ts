import { describe, expect, it } from "@jest/globals";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import {
  countMyReportsValidatedSteps,
  resolveMyReportsStepSegmentTone,
  superAdminGlobalRevisionNumber,
} from "@modules/report-draft/core/view/my-reports-card-progress";

const clock = { now: () => "2026-05-17T12:00:00.000Z" };
const idProvider = { next: () => "id-next" };

function draftInGlobalRevision(overrides?: {
  superAdminRevisionRequestedAt?: string | null;
  superAdminGlobalRevisionCount?: number;
  aggregateStatus?: ReportDraftDomainModel.AggregateStatus;
}): ReportDraftDomainModel.ReportDraft {
  const draft = ReportDraftFactory.create({
    idProvider,
    clock,
    hunterId: "hunter-1",
    overrides: {
      aggregateStatus: "under-review",
      ...overrides,
    },
  });
  draft.superAdminRevisionRequestedAt =
    overrides?.superAdminRevisionRequestedAt ?? "2026-05-17T20:00:00.000Z";
  draft.superAdminGlobalRevisionCount = overrides?.superAdminGlobalRevisionCount ?? 1;
  for (const key of [
    "meta",
    "description",
    "collection",
    "exploitation",
    "proofOfConcept",
    "risks",
    "remediation",
    "final",
  ] as const) {
    draft[key].status = "in-progress";
  }
  return draft;
}

describe("my-reports-card-progress", () => {
  it("preserves QC-validated segments during open global revision", () => {
    const draft = draftInGlobalRevision();
    const submissions: ReportDraftDomainModel.Submission<unknown>[] = [
      {
        id: "sub-1",
        reportDraftId: draft.id,
        step: ReportDraftDomainModel.ReportDraftStep.META,
        round: 1,
        payload: {},
        attachmentsSnapshot: [],
        submittedAt: "2026-05-16T10:00:00.000Z",
        submittedBy: "hunter-1",
        reviewerRole: "quality_checker",
        decision: "approve",
        decidedAt: "2026-05-16T11:00:00.000Z",
      },
    ];

    expect(resolveMyReportsStepSegmentTone(draft, "meta", submissions)).toBe(
      "qc-validated",
    );
    expect(resolveMyReportsStepSegmentTone(draft, "description", submissions)).toBe(
      "in-progress",
    );
    expect(countMyReportsValidatedSteps(draft, submissions)).toBe(1);
  });

  it("uses live step status when not in global revision", () => {
    const draft = ReportDraftFactory.create({
      idProvider,
      clock,
      hunterId: "hunter-1",
      overrides: { aggregateStatus: "under-review" },
    });
    draft.meta.status = "approved";

    expect(countMyReportsValidatedSteps(draft, [])).toBe(1);
  });

  it("defaults global revision label number to 1 when count missing", () => {
    const draft = draftInGlobalRevision({ superAdminGlobalRevisionCount: 0 });
    expect(superAdminGlobalRevisionNumber(draft)).toBe(1);
  });
});
