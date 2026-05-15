import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Loads draft + submission + comments for the QC review board.
 */
export const loadSubmissionForReview =
  (input: { submissionId: string }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.reviewLoadStarted());

    try {
      const submission = await deps.submissionRepository.findById(input.submissionId);
      if (submission === null) {
        dispatch(
          reportDraftsSlice.actions.reviewLoadFailed({
            message: `Submission '${input.submissionId}' not found.`,
          }),
        );
        return;
      }

      const draft = await deps.reportDraftRepository.findById(submission.reportDraftId);
      if (draft === null) {
        dispatch(
          reportDraftsSlice.actions.reviewLoadFailed({
            message: `Draft '${submission.reportDraftId}' not found.`,
          }),
        );
        return;
      }

      const comments = await deps.reviewerCommentRepository.findBySubmissionId(submission.id);

      dispatch(reportDraftsSlice.actions.draftUpserted(draft));
      dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
      dispatch(reportDraftsSlice.actions.commentsUpserted(comments));
      dispatch(reportDraftsSlice.actions.setCurrentDraftId(draft.id));
      dispatch(reportDraftsSlice.actions.setCurrentSubmissionId(submission.id));
      dispatch(reportDraftSlice.actions.setStep(submission.step));
      dispatch(reportDraftsSlice.actions.reviewLoadSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.reviewLoadFailed({ message }));
    }
  };
