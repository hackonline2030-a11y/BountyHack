import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: hunter submits one step of a draft to the assigned reviewer
 * role. Loads the aggregate, runs `submitStepForReview` (which freezes
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
    submittedBy: number;
  }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());

    try {
      const draft = await deps.reportDraftsGateway.findById(input.draftId);
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
      const submission = aggregate.submitStepForReview({
        step: input.step,
        reviewerRole: input.reviewerRole,
        submittedBy: input.submittedBy,
      });

      await deps.reportDraftsGateway.save(aggregate.state);
      await deps.submissionsGateway.save(submission);

      dispatch(reportDraftsSlice.actions.draftUpserted(aggregate.state));
      dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
