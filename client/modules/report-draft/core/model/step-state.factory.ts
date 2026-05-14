import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Default-builder for a `StepState<TPayload>` in its initial "in-progress"
 * phase — the hunter is editing, nothing has been submitted for review yet.
 *
 * Each of the 8 steps of a `ReportDraft` (META, DESCRIPTION, COLLECTION,
 * EXPLOITATION, PROOF_OF_CONCEPT, RISKS, REMEDIATION, FINAL) is wrapped
 * this way at draft creation. The `payload` itself is built by the step's
 * own payload-factory (`MetaFactory`, `DescriptionFactory`, or `""` for
 * the 6 free-form Markdown steps).
 *
 * Future siblings (when state-machine transitions land) will live here too:
 * `createAwaitingReview`, `createNeedsRevision`, `createApproved`.
 */
export class StepStateFactory {
  static createInProgress<TPayload>(
    payload: TPayload,
  ): ReportDraftDomainModel.StepState<TPayload> {
    return {
      payload,
      attachments: [],
      status: "in-progress",
      currentRound: 0,
      assignedReviewerRole: null,
    };
  }
}
