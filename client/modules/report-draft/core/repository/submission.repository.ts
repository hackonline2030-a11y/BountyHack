import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Persistence port for {@link ReportDraftDomainModel.Submission} snapshots.
 */
export interface ISubmissionRepository {
  save(submission: ReportDraftDomainModel.Submission<unknown>): Promise<void>;

  findById(id: string): Promise<ReportDraftDomainModel.Submission<unknown> | null>;

  findByDraftId(
    draftId: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]>;

  findLatestForStep(
    draftId: ReportDraftDomainModel.ReportDraftId,
    step: ReportDraftDomainModel.ReportDraftStep,
  ): Promise<ReportDraftDomainModel.Submission<unknown> | null>;

  /**
   * Submissions awaiting a reviewer decision (`decision === "pending"`),
   * filtered by assigned reviewer role, newest first.
   */
  findPendingForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]>;

  /**
   * All submissions assigned to a reviewer role (every round, every decision) —
   * for the QC traceability dashboard.
   */
  findAllForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]>;

  /** Mentor threads on report teams the QC belongs to (read-only on QC board). */
  findMentorPeerSubmissionsForQc(): Promise<
    ReportDraftDomainModel.Submission<unknown>[]
  >;
}
