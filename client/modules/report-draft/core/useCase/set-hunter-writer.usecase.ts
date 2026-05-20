import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

export const setReportDraftHunterWriter =
  (input: { draftId: string; hunterWriterId: string }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());
    try {
      await deps.reportDraftRepository.setHunterWriter(input);
      try {
        const draft = await deps.reportDraftRepository.findById(input.draftId);
        if (draft !== null) {
          dispatch(reportDraftsSlice.actions.draftUpserted(draft));
        }
      } catch {
        // Patch already succeeded. Readers without draft access (e.g. coordinators) get 403 on GET — ignore.
      }
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
