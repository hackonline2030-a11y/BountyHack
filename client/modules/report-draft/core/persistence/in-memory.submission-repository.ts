import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { SubmissionRepository } from "./submission-repository";

/**
 * Test / dev-mode adapter for {@link SubmissionRepository} backed by a
 * `Map`. Faithful to the port's contract:
 *
 * - `save` deep-clones the incoming submission so subsequent mutations of
 *   the caller's object don't leak into the store (mirrors a real DB
 *   round-trip through serialisation).
 * - `findById` / `findByDraftId` / `findLatestForStep` likewise return
 *   clones, so consumers cannot accidentally rewrite history by mutating
 *   what they got back.
 *
 * Implementation cost ≪ behavioural value: this adapter is enough to wire
 * the whole `report-draft` flow end-to-end in dev (no DB required) and to
 * exercise use cases in tests without mocking.
 */
export class InMemorySubmissionRepository implements SubmissionRepository {
  private readonly store = new Map<
    string,
    ReportDraftDomainModel.Submission<unknown>
  >();

  async save(submission: ReportDraftDomainModel.Submission<unknown>): Promise<void> {
    this.store.set(submission.id, clone(submission));
  }

  async findById(
    id: string,
  ): Promise<ReportDraftDomainModel.Submission<unknown> | null> {
    const found = this.store.get(id);
    return found ? clone(found) : null;
  }

  async findByDraftId(
    draftId: ReportDraftDomainModel.ReportDraftId,
  ): Promise<ReportDraftDomainModel.Submission<unknown>[]> {
    return Array.from(this.store.values())
      .filter((s) => s.reportDraftId === draftId)
      .sort((a, b) => a.round - b.round || a.step - b.step)
      .map(clone);
  }

  async findLatestForStep(
    draftId: ReportDraftDomainModel.ReportDraftId,
    step: ReportDraftDomainModel.ReportDraftStep,
  ): Promise<ReportDraftDomainModel.Submission<unknown> | null> {
    const matches = Array.from(this.store.values()).filter(
      (s) => s.reportDraftId === draftId && s.step === step,
    );
    if (matches.length === 0) return null;
    const latest = matches.reduce((a, b) => (a.round >= b.round ? a : b));
    return clone(latest);
  }
}

/**
 * JSON round-trip deep-clone. Submissions carry primitive scalars,
 * strings and arrays of attachment objects (themselves primitive-only),
 * so the round-trip is lossless. Avoids `structuredClone` which isn't
 * exposed by jsdom (the Jest env).
 */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
