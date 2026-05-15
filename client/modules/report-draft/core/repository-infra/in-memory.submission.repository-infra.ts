import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { ISubmissionRepository } from "@modules/report-draft/core/repository/submission.repository";

export class InMemorySubmissionRepository implements ISubmissionRepository {
  private readonly store = new Map<string, ReportDraftDomainModel.Submission<unknown>>();

  async save(submission: ReportDraftDomainModel.Submission<unknown>): Promise<void> {
    this.store.set(submission.id, clone(submission));
  }

  async findById(id: string): Promise<ReportDraftDomainModel.Submission<unknown> | null> {
    const found = this.store.get(id);
    return found ? clone(found) : null;
  }

  async findByDraftId(
    draftId: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]> {
    return Array.from(this.store.values())
      .filter((s) => s.reportDraftId === draftId)
      .sort((a, b) => {
        if (a.round !== b.round) {
          return a.round - b.round;
        }
        return a.step - b.step;
      })
      .map(clone);
  }

  async findLatestForStep(
    draftId: ReportDraftDomainModel.ReportDraftId,
    step: ReportDraftDomainModel.ReportDraftStep,
  ): Promise<ReportDraftDomainModel.Submission<unknown> | null> {
    const forStep = Array.from(this.store.values()).filter(
      (s) => s.reportDraftId === draftId && s.step === step,
    );
    if (forStep.length === 0) return null;
    const latest = forStep.reduce((best, current) =>
      current.round > best.round ? current : best,
    );
    return clone(latest);
  }

  async findPendingForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]> {
    return Array.from(this.store.values())
      .filter((s) => s.decision === "pending" && s.reviewerRole === reviewerRole)
      .sort((a, b) => sortSubmissionsNewestFirst(a, b))
      .map(clone);
  }

  async findAllForReviewerRole(
    reviewerRole: ReportDraftDomainModel.ReviewerRole,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]> {
    return Array.from(this.store.values())
      .filter((s) => s.reviewerRole === reviewerRole)
      .sort((a, b) => sortSubmissionsNewestFirst(a, b))
      .map(clone);
  }
}

function sortSubmissionsNewestFirst(
  a: ReportDraftDomainModel.Submission<unknown>,
  b: ReportDraftDomainModel.Submission<unknown>,
): number {
  if (a.submittedAt !== b.submittedAt) {
    return a.submittedAt < b.submittedAt ? 1 : -1;
  }
  if (a.reportDraftId !== b.reportDraftId) {
    return a.reportDraftId < b.reportDraftId ? -1 : 1;
  }
  if (a.step !== b.step) {
    return a.step - b.step;
  }
  return b.round - a.round;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
