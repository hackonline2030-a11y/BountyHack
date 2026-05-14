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
      const draft = await deps.reportDraftsGateway.findById(input.draftId);
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
      dispatch(reportDraftsSlice.actions.loadSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.loadFailed({ message }));
    }
  };
