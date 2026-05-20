import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const setReportDraftPrimaryHunter =
  (input: { draftId: string; hunterId: string }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());
    try {
      await deps.reportDraftRepository.setPrimaryHunter(input);
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
      throw error;
    }
  };
