import { ReportDraftFactory } from "@modules/report-draft/core/model/report-draft.factory";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: create a brand-new {@link ReportDraft} for a hunter.
 *
 * Orchestration:
 * 1. Dispatch `createReportDraftStarted` so the UI can show a spinner.
 * 2. Build the aggregate via `ReportDraftFactory` (id from `idProvider`,
 *    timestamps from `clock`, every step initialized to `in-progress`).
 * 3. Persist via `IReportDraftsGateway.save` — this is the first write,
 *    so optimistic locking trivially succeeds (`version === 0`).
 * 4. Mirror the freshly persisted aggregate into the slice (`draftUpserted`),
 *    flag it as the currently-edited draft (`setCurrentDraftId`), and
 *    flip `creation` to `success`.
 *
 * Error path: any throw between step 2 and 3 ends up in
 * `createReportDraftFailed` with a human-readable message — slice stays
 * coherent (no half-committed draft) and the UI can retry.
 */
export const createReportDraft =
  (input: { hunterId: string }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<string | null> => {
    dispatch(reportDraftsSlice.actions.createReportDraftStarted());

    try {
      const draft = ReportDraftFactory.create({
        idProvider: deps.idProvider,
        clock: deps.clock,
        hunterId: input.hunterId,
      });
      await deps.reportDraftRepository.save(draft);

      dispatch(reportDraftsSlice.actions.draftUpserted(draft));
      dispatch(reportDraftsSlice.actions.setCurrentDraftId(draft.id));
      dispatch(
        reportDraftsSlice.actions.createReportDraftSucceeded({ draftId: draft.id }),
      );
      return draft.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.createReportDraftFailed({ message }));
      return null;
    }
  };
