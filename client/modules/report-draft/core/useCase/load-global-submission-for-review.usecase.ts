import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { loadReportDraft } from "@modules/report-draft/core/useCase/load-report-draft.usecase";
import { Dependencies } from "@store/dependencies";
import { AppDispatch } from "@store/redux/store";

export const loadGlobalSubmissionForReview =
  (input: { globalSubmissionId: string }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportDraftsSlice.actions.reviewLoadStarted());

    try {
      const globalSubmission = await deps.globalSubmissionRepository.findById(
        input.globalSubmissionId,
      );
      if (globalSubmission === null) {
        dispatch(
          reportDraftsSlice.actions.reviewLoadFailed({
            message: `Global submission '${input.globalSubmissionId}' not found.`,
          }),
        );
        return;
      }

      dispatch(reportDraftsSlice.actions.globalSubmissionUpserted(globalSubmission));

      const comments = await deps.globalSubmissionRepository.listComments(
        input.globalSubmissionId,
      );
      dispatch(reportDraftsSlice.actions.globalReviewerCommentsUpserted(comments));

      await dispatch(loadReportDraft({ draftId: globalSubmission.reportDraftId }));
      dispatch(reportDraftsSlice.actions.reviewLoadSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.reviewLoadFailed({ message }));
    }
  };
