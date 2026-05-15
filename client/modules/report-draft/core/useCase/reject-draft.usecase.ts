import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: outright rejection of a draft (off-scope, duplicate,
 * malicious, …). Unlike `giveUpDraft`, this expresses a content-level
 * verdict from a reviewer, not a process-level abandon. Terminal — no
 * submissions or revisions can follow.
 *
 * V2: persist `byUser` / `byRole` / `reason` as audit fields on the draft.
 */
export const rejectDraft =
  (input: {
    draftId: string;
    byUser: string;
    byRole: ReportDraftDomainModel.ReviewerRole;
  }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());

    try {
      const draft = await deps.reportDraftRepository.findById(input.draftId);
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
      aggregate.rejectDraft({ byUser: input.byUser, byRole: input.byRole });

      await deps.reportDraftRepository.save(aggregate.state);

      dispatch(reportDraftsSlice.actions.draftUpserted(aggregate.state));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
