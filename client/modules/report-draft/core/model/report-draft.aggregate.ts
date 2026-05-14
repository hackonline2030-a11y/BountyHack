import { IClockProvider } from "@modules/core/provider/clock-provider";
import { IIdProvider } from "@modules/core/provider/id-provider";
import { ReportDraftDomainModel } from "./report-draft.domain-model";

export interface ReportDraftAggregateDeps {
  idProvider: IIdProvider;
  clock: IClockProvider;
}

/**
 * Aggregate root encapsulating the state-machine of a {@link ReportDraftDomainModel.ReportDraft}.
 *
 * Hosts every legal transition (`submitStepForReview`, future `approveStep`,
 * `requestStepRevisions`, `giveUpDraft`, `rejectDraft`, …) and guarantees
 * domain invariants — no caller can put the draft in an inconsistent state.
 *
 * The aggregate is **mutable** : commands mutate the wrapped draft in place
 * and may return ancillary domain objects (e.g. {@link ReportDraftDomainModel.Submission}).
 * It is **pure domain** : no repository is injected. Persistence of returned
 * artefacts (Submissions, Comments) is the caller's responsibility (a use
 * case at the application layer that owns `SubmissionRepository`, etc.).
 */
export class ReportDraftAggregate {
  constructor(
    private _state: ReportDraftDomainModel.ReportDraft,
    private deps: ReportDraftAggregateDeps,
  ) {}

  get state(): ReportDraftDomainModel.ReportDraft {
    return this._state;
  }

  /**
   * Move a single step from "in-progress" (or "needs-revision") to
   * "awaiting-review". Bumps the step's round counter, assigns the target
   * reviewer role, and freezes the current payload + attachments into an
   * immutable {@link ReportDraftDomainModel.Submission} snapshot returned
   * to the caller.
   *
   * Side effects on the draft:
   * - `step.status` → `"awaiting-review"`
   * - `step.currentRound` → `step.currentRound + 1`
   * - `step.assignedReviewerRole` → `input.reviewerRole`
   * - `aggregateStatus` → `"under-review"` (only if it was `"draft"`)
   * - `updatedAt` → `clock.now()`
   * - `version` → `version + 1` (optimistic lock)
   *
   * Throws when the aggregate is terminal or the step is not editable.
   */
  submitStepForReview(input: {
    step: ReportDraftDomainModel.ReportDraftStep;
    reviewerRole: ReportDraftDomainModel.ReviewerRole;
    submittedBy: number;
  }): ReportDraftDomainModel.Submission<unknown> {
    this.guardAggregateNotTerminal();

    const stepKey = stepEnumToKey(input.step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    this.guardStepIsEditable(stepState, input.step);

    const now = this.deps.clock.now();
    const nextRound = stepState.currentRound + 1;

    const submission: ReportDraftDomainModel.Submission<unknown> = {
      id: this.deps.idProvider.next(),
      reportDraftId: this._state.id,
      step: input.step,
      round: nextRound,
      payload: snapshot(stepState.payload),
      attachmentsSnapshot: [...stepState.attachments],
      submittedAt: now,
      submittedBy: input.submittedBy,
      reviewerRole: input.reviewerRole,
      decision: "pending",
    };

    stepState.status = "awaiting-review";
    stepState.currentRound = nextRound;
    stepState.assignedReviewerRole = input.reviewerRole;

    if (this._state.aggregateStatus === "draft") {
      this._state.aggregateStatus = "under-review";
    }
    this._state.updatedAt = now;
    this._state.version += 1;

    return submission;
  }

  private guardAggregateNotTerminal(): void {
    const status = this._state.aggregateStatus;
    if (
      status === "given-up" ||
      status === "rejected" ||
      status === "submitted-to-program"
    ) {
      throw new Error(
        `ReportDraftAggregate: cannot submit a step on a '${status}' draft (terminal state).`,
      );
    }
  }

  private guardStepIsEditable(
    stepState: ReportDraftDomainModel.StepState<unknown>,
    step: ReportDraftDomainModel.ReportDraftStep,
  ): void {
    if (stepState.status !== "in-progress" && stepState.status !== "needs-revision") {
      throw new Error(
        `ReportDraftAggregate: cannot submit step ${ReportDraftDomainModel.ReportDraftStep[step]} ` +
          `for review: current status is '${stepState.status}', ` +
          `expected 'in-progress' or 'needs-revision'.`,
      );
    }
  }
}

type StepKey =
  | "meta"
  | "description"
  | "collection"
  | "exploitation"
  | "proofOfConcept"
  | "risks"
  | "remediation"
  | "final";

/**
 * Maps a {@link ReportDraftDomainModel.ReportDraftStep} enum value to the
 * corresponding key on {@link ReportDraftDomainModel.ReportDraft}.
 *
 * The exhaustive `switch` on the enum lets TypeScript flag any missing case
 * if a new step is added — keeps the aggregate in sync with the domain.
 */
function stepEnumToKey(step: ReportDraftDomainModel.ReportDraftStep): StepKey {
  const Step = ReportDraftDomainModel.ReportDraftStep;
  switch (step) {
    case Step.META:
      return "meta";
    case Step.DESCRIPTION:
      return "description";
    case Step.COLLECTION:
      return "collection";
    case Step.EXPLOITATION:
      return "exploitation";
    case Step.PROOF_OF_CONCEPT:
      return "proofOfConcept";
    case Step.RISKS:
      return "risks";
    case Step.REMEDIATION:
      return "remediation";
    case Step.FINAL:
      return "final";
  }
}

/**
 * Deep-clones a step payload so the {@link ReportDraftDomainModel.Submission}
 * snapshot stays immutable even if the hunter later edits the live draft.
 *
 * Strings are immutable in JS — passed through unchanged. Object payloads
 * (`MetaFields`, `DescriptionFields`) are cloned via a JSON round-trip:
 * they only carry primitive (string) properties, so the round-trip is
 * lossless. We avoid `structuredClone` because Jest's jsdom environment
 * does not expose it as a global.
 */
function snapshot<T>(payload: T): T {
  if (payload === null || payload === undefined || typeof payload !== "object") {
    return payload;
  }
  return JSON.parse(JSON.stringify(payload)) as T;
}
