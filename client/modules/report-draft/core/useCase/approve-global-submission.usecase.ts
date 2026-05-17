import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch } from "@store/redux/store";

export const approveGlobalSubmission =
  (input: { globalSubmissionId: string }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());

    try {
      const globalSubmission = await deps.globalSubmissionRepository.findById(
        input.globalSubmissionId,
      );
      const draft = await deps.globalSubmissionRepository.approve(input.globalSubmissionId);
      if (globalSubmission) {
        const allForDraft = await deps.globalSubmissionRepository.findByDraftId(
          globalSubmission.reportDraftId,
        );
        for (const row of allForDraft) {
          dispatch(reportDraftsSlice.actions.globalSubmissionUpserted(row));
        }
      }
      dispatch(reportDraftsSlice.actions.draftUpserted(draft));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
