import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: fetch every {@link ReportDraft} owned by a hunter and refresh
 * the `myDraftIds` index. Pure read — no aggregate is involved.
 *
 * Ordering is preserved as returned by the gateway (the in-memory adapter
 * sorts by `updatedAt DESC` so the latest-edited draft comes first).
 */
export const listMyDrafts =
  (input: { hunterId: string }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.listStarted());

    try {
      const drafts = await deps.reportDraftsGateway.findByHunterId(input.hunterId);
      dispatch(reportDraftsSlice.actions.listSucceeded({ drafts }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.listFailed({ message }));
    }
  };
