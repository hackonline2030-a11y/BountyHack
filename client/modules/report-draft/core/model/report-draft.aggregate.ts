import { IClockProvider } from "@modules/core/provider/clock-provider";
import { IIdProvider } from "@modules/core/provider/id-provider";
import { ReportDraftDomainModel } from "./report-draft.domain-model";

export interface ReportDraftAggregateDeps {
  idProvider: IIdProvider;
  clock: IClockProvider;
}

/**
 * Shape expected for a fresh {@link ReportDraftDomainModel.ReviewerComment}
 * passed to `requestStepRevisions`: the aggregate stamps `id`, `submissionId`
 * and `createdAt` itself (idProvider + clock), the caller only carries
 * domain-level intent.
 */
export type ReviewerCommentDraft = Pick<
  ReportDraftDomainModel.ReviewerComment,
  "body" | "authorId" | "authorRole" | "anchor"
>;

/**
 * Aggregate root encapsulating the state-machine of a {@link ReportDraftDomainModel.ReportDraft}.
 *
 * Hosts every legal transition and guarantees domain invariants — no caller
 * can put the draft in an inconsistent state.
 *
 * The aggregate is **mutable** : commands mutate the wrapped draft (and the
 * passed-in submissions) in place and may return ancillary domain objects
 * (new Submission, new ReviewerComment[], …).
 *
 * The aggregate is **pure domain** : no repository is injected. Persistence
 * of returned artefacts is the caller's responsibility (a use case at the
 * application layer that owns `SubmissionRepository`, etc.).
 */
export class ReportDraftAggregate {
  constructor(
    private _state: ReportDraftDomainModel.ReportDraft,
    private deps: ReportDraftAggregateDeps,
  ) {}

  get state(): ReportDraftDomainModel.ReportDraft {
    return this._state;
  }

  // ──────────────────────────────────────────────────────────────────────
  // Hunter-side commands
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Move a single step from "in-progress" (or "needs-revision" after a
   * revision round) to "awaiting-review". Bumps round, assigns reviewer,
   * and freezes the current payload + attachments into an immutable
   * Submission snapshot returned to the caller.
   */
  submitStepForReview(input: {
    step: ReportDraftDomainModel.ReportDraftStep;
    reviewerRole: ReportDraftDomainModel.ReviewerRole;
    submittedBy: number;
  }): ReportDraftDomainModel.Submission<unknown> {
    this.guardAggregateNotTerminal("submit a step on");

    const stepKey = stepEnumToKey(input.step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    if (stepState.status !== "in-progress" && stepState.status !== "needs-revision") {
      throw new Error(
        `ReportDraftAggregate: cannot submit step ${ReportDraftDomainModel.ReportDraftStep[input.step]} ` +
          `for review: current status is '${stepState.status}', ` +
          `expected 'in-progress' or 'needs-revision'.`,
      );
    }

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

  /**
   * Re-open a step previously marked "needs-revision" so the hunter can
   * edit it again. Does NOT bump the round counter — only `submitStepForReview`
   * does (one round = one submit/review cycle).
   */
  resumeEdit(step: ReportDraftDomainModel.ReportDraftStep): void {
    this.guardAggregateNotTerminal("resume editing on");

    const stepKey = stepEnumToKey(step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    if (stepState.status !== "needs-revision") {
      throw new Error(
        `ReportDraftAggregate: cannot resume editing step ${ReportDraftDomainModel.ReportDraftStep[step]}: ` +
          `current status is '${stepState.status}', expected 'needs-revision'.`,
      );
    }

    stepState.status = "in-progress";
    this._state.updatedAt = this.deps.clock.now();
    this._state.version += 1;
  }

  // ──────────────────────────────────────────────────────────────────────
  // Reviewer-side commands
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Reviewer approves a submission. Mutates the submission's decision in
   * place (so the caller can persist the updated submission), flips the
   * step to "approved", and — if every step is now approved — promotes the
   * aggregate to "ready-to-program".
   */
  approveStep(input: {
    submission: ReportDraftDomainModel.Submission<unknown>;
    decidedBy: number;
  }): void {
    this.guardAggregateNotTerminal("approve a step on");
    const { submission, decidedBy } = input;
    const stepKey = this.guardSubmissionMatchesPendingStep(submission, "approve");

    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    const now = this.deps.clock.now();

    submission.decision = "approve";
    submission.decidedAt = now;
    submission.decidedBy = decidedBy;

    stepState.status = "approved";

    this._state.updatedAt = now;
    this._state.version += 1;

    if (this.allStepsApproved()) {
      this._state.aggregateStatus = "ready-to-program";
    }
  }

  /**
   * Reviewer asks for changes. Mutates the submission in place, flips the
   * step to "needs-revision", and creates one fresh {@link ReportDraftDomainModel.ReviewerComment}
   * per entry in `comments` (id + createdAt stamped by the aggregate).
   *
   * Requires at least one comment — requesting revisions without saying why
   * is a domain-level error.
   */
  requestStepRevisions(input: {
    submission: ReportDraftDomainModel.Submission<unknown>;
    decidedBy: number;
    comments: ReadonlyArray<ReviewerCommentDraft>;
  }): ReportDraftDomainModel.ReviewerComment[] {
    this.guardAggregateNotTerminal("request revisions on");
    const { submission, decidedBy, comments } = input;

    if (comments.length === 0) {
      throw new Error(
        "ReportDraftAggregate: requestStepRevisions requires at least one comment " +
          "explaining what needs to change.",
      );
    }

    const stepKey = this.guardSubmissionMatchesPendingStep(submission, "request revisions on");

    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    const now = this.deps.clock.now();

    submission.decision = "request-changes";
    submission.decidedAt = now;
    submission.decidedBy = decidedBy;

    stepState.status = "needs-revision";

    this._state.updatedAt = now;
    this._state.version += 1;

    return comments.map<ReportDraftDomainModel.ReviewerComment>((c) => ({
      id: this.deps.idProvider.next(),
      submissionId: submission.id,
      body: c.body,
      authorId: c.authorId,
      authorRole: c.authorRole,
      anchor: c.anchor,
      createdAt: now,
    }));
  }

  // ──────────────────────────────────────────────────────────────────────
  // Terminal commands (any reviewer role, hunter included for peer-review)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Abandon the draft (typically because the hunter went silent or one of
   * the reviewers decided the report cannot reach acceptable quality).
   * Terminal — no further transitions allowed.
   *
   * V2: persist `byUser` / `byRole` / `reason` on the draft for audit.
   */
  giveUpDraft(input: {
    byUser: number;
    byRole: ReportDraftDomainModel.ReviewerRole;
  }): void {
    this.guardAggregateNotTerminal("give up");
    // V2: persist input.byUser / input.byRole / reason as audit fields.
    void input;

    this._state.aggregateStatus = "given-up";
    this._state.updatedAt = this.deps.clock.now();
    this._state.version += 1;
  }

  /**
   * Outright rejection — content is unfit (off-scope, duplicate, malicious,
   * …). Terminal, no submissions or revisions can follow.
   *
   * V2: persist `byUser` / `byRole` / `reason` on the draft for audit.
   */
  rejectDraft(input: {
    byUser: number;
    byRole: ReportDraftDomainModel.ReviewerRole;
  }): void {
    this.guardAggregateNotTerminal("reject");
    void input;

    this._state.aggregateStatus = "rejected";
    this._state.updatedAt = this.deps.clock.now();
    this._state.version += 1;
  }

  // ──────────────────────────────────────────────────────────────────────
  // Guards & helpers
  // ──────────────────────────────────────────────────────────────────────

  private guardAggregateNotTerminal(actionVerb: string): void {
    const status = this._state.aggregateStatus;
    if (
      status === "given-up" ||
      status === "rejected" ||
      status === "submitted-to-program"
    ) {
      throw new Error(
        `ReportDraftAggregate: cannot ${actionVerb} a '${status}' draft (terminal state).`,
      );
    }
  }

  /**
   * Cross-checks a submission against the live draft before the reviewer
   * decides on it. Returns the step's property key for the caller to
   * access the corresponding `StepState`.
   *
   * Catches three classes of bug:
   * - "wrong draft"   → submission was loaded from another aggregate
   * - "stale round"   → hunter already resubmitted before reviewer decided
   * - "already done"  → reviewer tries to decide twice on the same submission
   */
  private guardSubmissionMatchesPendingStep(
    submission: ReportDraftDomainModel.Submission<unknown>,
    actionVerb: string,
  ): StepKey {
    if (submission.reportDraftId !== this._state.id) {
      throw new Error(
        `ReportDraftAggregate: cannot ${actionVerb} submission ${submission.id}: ` +
          `it belongs to draft '${submission.reportDraftId}', not '${this._state.id}'.`,
      );
    }
    if (submission.decision !== "pending") {
      throw new Error(
        `ReportDraftAggregate: cannot ${actionVerb} submission ${submission.id}: ` +
          `already decided ('${submission.decision}').`,
      );
    }

    const stepKey = stepEnumToKey(submission.step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    if (submission.round !== stepState.currentRound) {
      throw new Error(
        `ReportDraftAggregate: cannot ${actionVerb} submission ${submission.id}: ` +
          `stale round (submission round ${submission.round}, ` +
          `step is now at round ${stepState.currentRound}).`,
      );
    }
    if (stepState.status !== "awaiting-review") {
      throw new Error(
        `ReportDraftAggregate: cannot ${actionVerb} step ` +
          `${ReportDraftDomainModel.ReportDraftStep[submission.step]}: ` +
          `current status is '${stepState.status}', expected 'awaiting-review'.`,
      );
    }
    return stepKey;
  }

  private allStepsApproved(): boolean {
    return STEP_KEYS.every((key) => this._state[key].status === "approved");
  }
}

// ────────────────────────────────────────────────────────────────────────
// Step <-> property-key mapping
// ────────────────────────────────────────────────────────────────────────

type StepKey =
  | "meta"
  | "description"
  | "collection"
  | "exploitation"
  | "proofOfConcept"
  | "risks"
  | "remediation"
  | "final";

const STEP_KEYS: ReadonlyArray<StepKey> = [
  "meta",
  "description",
  "collection",
  "exploitation",
  "proofOfConcept",
  "risks",
  "remediation",
  "final",
];

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
