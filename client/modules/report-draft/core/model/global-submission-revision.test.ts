import {
  globalReviewerCommentsForPlacement,
  resolveHunterGlobalSubmitRevisionNumber,
} from "@modules/report-draft/core/model/global-submission-revision";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

describe("resolveHunterGlobalSubmitRevisionNumber", () => {
  const draft = {
    id: "draft-1",
    superAdminGlobalRevisionCount: 1,
  } as ReportDraftDomainModel.ReportDraft;

  it("keeps revision 1 on first hunter submit", () => {
    expect(resolveHunterGlobalSubmitRevisionNumber(draft, [])).toBe(1);
  });

  it("increments to revision 2 when resubmitting after prior decisions", () => {
    const subs: ReportDraftDomainModel.GlobalSubmission[] = [
      {
        id: "gs-qc",
        reportDraftId: draft.id,
        revisionNumber: 1,
        payload: {},
        submittedAt: "2026-05-17T00:00:00.000Z",
        submittedBy: "hunter",
        reviewerRole: "quality_checker",
        decision: "request-changes",
      },
    ];
    expect(resolveHunterGlobalSubmitRevisionNumber(draft, subs)).toBe(2);
  });
});

describe("globalReviewerCommentsForPlacement", () => {
  const draftId = "draft-1";

  it("places super-admin comments in super_admin tab even when linked to QC submission row", () => {
    const globalSubmissions: ReportDraftDomainModel.GlobalSubmission[] = [
      {
        id: "gs-qc",
        reportDraftId: draftId,
        revisionNumber: 1,
        payload: {},
        submittedAt: "2026-05-17T00:00:00.000Z",
        submittedBy: "hunter",
        reviewerRole: "quality_checker",
        decision: "request-changes",
      },
    ];
    const comments: ReportDraftDomainModel.GlobalReviewerComment[] = [
      {
        id: "c-sa",
        globalSubmissionId: "gs-qc",
        authorId: "sa-1",
        authorRole: "super_admin",
        body: "super-admin : mon commentaire",
        createdAt: "2026-05-17T22:16:03.000Z",
      },
    ];

    expect(
      globalReviewerCommentsForPlacement(draftId, globalSubmissions, comments, "quality_checker"),
    ).toHaveLength(0);
    expect(
      globalReviewerCommentsForPlacement(draftId, globalSubmissions, comments, "super_admin"),
    ).toHaveLength(1);
  });
});
