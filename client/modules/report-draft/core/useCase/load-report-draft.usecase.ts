import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: fetch a single {@link ReportDraft} by id and mirror it into
 * the slice. Sets it as the wizard's current draft so the page can read
 * `byId[currentDraftId]` without further coordination.
 *
 * A missing draft is treated as a domain-level failure (error status),
 * not an exception — the UI typically renders a "not found" view.
 */
export const loadReportDraft =
  (input: { draftId: string }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.loadStarted());

    try {
      const draft = await deps.reportDraftRepository.findById(input.draftId);
      if (draft === null) {
        dispatch(
          reportDraftsSlice.actions.loadFailed({
            message: `Draft '${input.draftId}' not found.`,
          }),
        );
        return;
      }

      dispatch(reportDraftsSlice.actions.draftUpserted(draft));
      dispatch(reportDraftsSlice.actions.setCurrentDraftId(draft.id));

      const submissions = await deps.submissionRepository.findByDraftId(draft.id);
      for (const submission of submissions) {
        dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
        const comments = await deps.reviewerCommentRepository.findBySubmissionId(
          submission.id,
        );
        if (comments.length > 0) {
          dispatch(reportDraftsSlice.actions.commentsUpserted(comments));
        }
      }

      const globalSubmissions = await deps.globalSubmissionRepository.findByDraftId(
        draft.id,
      );
      for (const globalSubmission of globalSubmissions) {
        dispatch(reportDraftsSlice.actions.globalSubmissionUpserted(globalSubmission));
        const comments = await deps.globalSubmissionRepository.listComments(
          globalSubmission.id,
        );
        if (comments.length > 0) {
          dispatch(reportDraftsSlice.actions.globalReviewerCommentsUpserted(comments));
        }
      }

      dispatch(reportDraftsSlice.actions.loadSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.loadFailed({ message }));
    }
  };
