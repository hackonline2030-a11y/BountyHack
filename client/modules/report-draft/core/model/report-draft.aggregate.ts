import { IClockProvider } from "@modules/core/provider/clock-provider";
import { IIdProvider } from "@modules/core/provider/id-provider";
import { ReportDraftDomainModel } from "./report-draft.domain-model";
import {
  REPORT_DRAFT_STEP_STATE_KEYS,
  reportDraftStepToStateKey,
  type ReportDraftStepStateKey,
} from "./report-draft-step-keys";
import {
  isGlobalStepEditable,
  isGlobalStepEligibleForSubmit,
  isGlobalStepStatus,
} from "./global-step-status";
import { isStepValidationReviewerRole } from "./step-validation-reviewer";

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
 * The aggregate is **pure domain** : no gateway is injected. Persistence
 * of returned artefacts is the caller's responsibility (a use case at the
 * application layer that owns `ISubmissionsGateway`, etc.).
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
  /**
   * Optional mentor advice — creates a pending submission but keeps the step
   * editable. Does not gate the hunter « Suivant » button.
   */
  submitMentorAdvice(input: {
    step: ReportDraftDomainModel.ReportDraftStep;
    submittedBy: string;
  }): ReportDraftDomainModel.Submission<unknown> {
    this.guardAggregateNotTerminal("request mentor advice on");

    const stepKey = reportDraftStepToStateKey(input.step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    if (stepState.status !== "in-progress" && stepState.status !== "needs-revision") {
      throw new Error(
        `ReportDraftAggregate: cannot request mentor advice on step ${ReportDraftDomainModel.ReportDraftStep[input.step]}: ` +
          `current status is '${stepState.status}', expected 'in-progress' or 'needs-revision'.`,
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
      reviewerRole: "mentor",
      decision: "pending",
    };

    stepState.currentRound = nextRound;
    stepState.assignedReviewerRole = null;

    if (this._state.aggregateStatus === "draft") {
      this._state.aggregateStatus = "under-review";
    }
    this._state.updatedAt = now;
    this._state.version += 1;

    return submission;
  }

  /**
   * Hunter submits for QC (or super-admin) validation — locks the step until
   * `approveStep`. Mentor advice uses {@link submitMentorAdvice} instead.
   */
  submitStepForReview(input: {
    step: ReportDraftDomainModel.ReportDraftStep;
    reviewerRole: ReportDraftDomainModel.ReviewerRole;
    submittedBy: string;
  }): ReportDraftDomainModel.Submission<unknown> {
    this.guardAggregateNotTerminal("submit a step on");

    if (!isStepValidationReviewerRole(input.reviewerRole)) {
      throw new Error(
        "ReportDraftAggregate: step validation must be requested from a quality checker (or super admin). " +
          "Use submitMentorAdvice for optional mentor feedback.",
      );
    }

    if (
      this._state.aggregateStatus === "under-global-review" ||
      isGlobalStepStatus(
        (this._state[reportDraftStepToStateKey(input.step)] as ReportDraftDomainModel.StepState<unknown>)
          .status,
      )
    ) {
      throw new Error(
        "ReportDraftAggregate: per-step submit is disabled during super-admin global revision; use global submit.",
      );
    }

    const stepKey = reportDraftStepToStateKey(input.step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;

    const escalatesFromMentorQueue =
      stepState.status === "awaiting-review" &&
      stepState.assignedReviewerRole === "mentor";

    if (
      stepState.status !== "in-progress" &&
      stepState.status !== "needs-revision" &&
      !escalatesFromMentorQueue
    ) {
      throw new Error(
        `ReportDraftAggregate: cannot submit step ${ReportDraftDomainModel.ReportDraftStep[input.step]} ` +
          `for review: current status is '${stepState.status}', ` +
          `expected 'in-progress', 'needs-revision', or mentor-queue escalation to QC.`,
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
   * @deprecated Prefer server global submission API. Marks eligible global steps
   * as awaiting-global-review (no per-step QC submissions).
   */
  submitAllStepsForGlobalRevision(input: {
    submittedBy: string;
  }): ReportDraftDomainModel.Submission<unknown>[] {
    void input.submittedBy;
    if (
      this._state.aggregateStatus !== "under-global-review" ||
      !this._state.superAdminRevisionRequestedAt?.trim()
    ) {
      throw new Error(
        "ReportDraftAggregate: global batch submit is only allowed while under-global-review.",
      );
    }

    const now = this.deps.clock.now();
    let moved = 0;
    for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
      const stepState = this._state[key] as ReportDraftDomainModel.StepState<unknown>;
      if (!isGlobalStepEligibleForSubmit(stepState.status)) continue;
      stepState.status = "awaiting-global-review";
      stepState.assignedReviewerRole = "quality_checker";
      moved += 1;
    }

    if (moved === 0) {
      throw new Error(
        "ReportDraftAggregate: no steps eligible for global submit.",
      );
    }

    this._state.updatedAt = now;
    this._state.version += 1;
    return [];
  }

  /**
   * Replace a step's in-progress payload (typing autosave / "Continuer"
   * button). Pure edit, no transition: bumps `updatedAt` + `version` but
   * leaves status, round and reviewer assignment untouched.
   *
   * Editing is only legal while the step is still mutable — `in-progress`
   * or `needs-revision`. Touching a step that's `awaiting-review` (locked
   * for a reviewer) or `approved` (frozen) is a domain-level error.
   */
  updateStepPayload<T>(input: {
    step: ReportDraftDomainModel.ReportDraftStep;
    payload: T;
  }): void {
    this.guardAggregateNotTerminal("edit a step on");

    const stepKey = reportDraftStepToStateKey(input.step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    const editable =
      stepState.status === "in-progress" ||
      stepState.status === "needs-revision" ||
      isGlobalStepEditable(stepState.status);
    if (!editable) {
      throw new Error(
        `ReportDraftAggregate: cannot edit step ${ReportDraftDomainModel.ReportDraftStep[input.step]}: ` +
          `current status is '${stepState.status}'.`,
      );
    }

    stepState.payload = input.payload;
    this._state.updatedAt = this.deps.clock.now();
    this._state.version += 1;
  }

  /**
   * Re-open a step previously marked "needs-revision" so the hunter can
   * edit it again. Does NOT bump the round counter — only `submitStepForReview`
   * does (one round = one submit/review cycle).
   */
  resumeEdit(step: ReportDraftDomainModel.ReportDraftStep): void {
    this.guardAggregateNotTerminal("resume editing on");

    const stepKey = reportDraftStepToStateKey(step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    if (stepState.status === "needs-global-revision") {
      stepState.status = "in-global-progress";
      this._state.updatedAt = this.deps.clock.now();
      this._state.version += 1;
      return;
    }

    if (stepState.status !== "needs-revision") {
      throw new Error(
        `ReportDraftAggregate: cannot resume editing step ${ReportDraftDomainModel.ReportDraftStep[step]}: ` +
          `current status is '${stepState.status}', expected 'needs-revision' or 'needs-global-revision'.`,
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
  /**
   * Mentor advisory OK — records `endorse` on the submission and re-opens the
   * step for the hunter to submit to the quality checker. Does NOT approve the step.
   */
  endorseSubmission(input: {
    submission: ReportDraftDomainModel.Submission<unknown>;
    decidedBy: string;
  }): void {
    this.guardAggregateNotTerminal("endorse a submission on");
    const { submission, decidedBy } = input;
    if (submission.reviewerRole !== "mentor") {
      throw new Error(
        "ReportDraftAggregate: endorseSubmission applies only to mentor-targeted submissions.",
      );
    }
    const stepKey = this.guardSubmissionMatchesPendingStep(submission, "endorse", {
      allowedStatuses: ["awaiting-review", "in-progress"],
    });

    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    const now = this.deps.clock.now();

    submission.decision = "endorse";
    submission.decidedAt = now;
    submission.decidedBy = decidedBy;

    stepState.status = "in-progress";
    stepState.assignedReviewerRole = null;

    this._state.updatedAt = now;
    this._state.version += 1;
  }

  approveStep(input: {
    submission: ReportDraftDomainModel.Submission<unknown>;
    decidedBy: string;
  }): void {
    this.guardAggregateNotTerminal("approve a step on");
    const { submission, decidedBy } = input;
    if (
      submission.reviewerRole !== "quality_checker" &&
      submission.reviewerRole !== "super_admin"
    ) {
      throw new Error(
        "ReportDraftAggregate: only a quality checker (or super admin) can approve a wizard step.",
      );
    }
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
    decidedBy: string;
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
    byUser: string;
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
    byUser: string;
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
      status === "submitted-to-program" ||
      status === "published"
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
    options?: { allowedStatuses?: ReadonlyArray<ReportDraftDomainModel.StepStatus> },
  ): ReportDraftStepStateKey {
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

    const stepKey = reportDraftStepToStateKey(submission.step);
    const stepState = this._state[stepKey] as ReportDraftDomainModel.StepState<unknown>;
    if (submission.round !== stepState.currentRound) {
      throw new Error(
        `ReportDraftAggregate: cannot ${actionVerb} submission ${submission.id}: ` +
          `stale round (submission round ${submission.round}, ` +
          `step is now at round ${stepState.currentRound}).`,
      );
    }
    const allowedStatuses = options?.allowedStatuses ?? ["awaiting-review"];
    if (!allowedStatuses.includes(stepState.status)) {
      throw new Error(
        `ReportDraftAggregate: cannot ${actionVerb} step ` +
          `${ReportDraftDomainModel.ReportDraftStep[submission.step]}: ` +
          `current status is '${stepState.status}', expected one of: ${allowedStatuses.join(", ")}.`,
      );
    }
    return stepKey;
  }

  private allStepsApproved(): boolean {
    return REPORT_DRAFT_STEP_STATE_KEYS.every((key) => this._state[key].status === "approved");
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
