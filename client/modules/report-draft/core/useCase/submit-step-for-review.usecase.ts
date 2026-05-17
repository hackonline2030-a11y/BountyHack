import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: hunter submits one step for QC validation. Loads the aggregate,
 * runs `submitStepForReview` (which freezes
 * the current payload + attachments into a {@link ReportDraftDomainModel.Submission}
 * snapshot and flips the step to `awaiting-review`), then persists both
 * the updated draft and the new submission before mirroring the changes
 * into the slice.
 */
export const submitStepForReview =
  (input: {
    draftId: string;
    step: ReportDraftDomainModel.ReportDraftStep;
    reviewerRole: ReportDraftDomainModel.ReviewerRole;
    submittedBy: string;
    /** When set, persisted on the draft before the submission snapshot. */
    payload?: unknown;
  }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());

    try {
      const draft = await deps.reportDraftRepository.findById(input.draftId);
      if (draft === null) {
        dispatch(
          reportDraftsSlice.actions.transitionFailed({
            message: `Draft '${input.draftId}' not found.`,
          }),
        );
        return;
      }

      const aggregate = new ReportDraftAggregate(draft, {
        idProvider: deps.idProvider,
        clock: deps.clock,
      });
      if (input.payload !== undefined) {
        aggregate.updateStepPayload({ step: input.step, payload: input.payload });
      }
      const submission = aggregate.submitStepForReview({
        step: input.step,
        reviewerRole: input.reviewerRole,
        submittedBy: input.submittedBy,
      });

      await deps.reportDraftRepository.save(aggregate.state);
      await deps.submissionRepository.save(submission);

      dispatch(reportDraftsSlice.actions.draftUpserted(aggregate.state));
      dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
