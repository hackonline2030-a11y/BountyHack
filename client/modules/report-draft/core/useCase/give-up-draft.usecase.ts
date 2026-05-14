import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: terminal abandon of a draft. Any reviewer role (hunter
 * included, for peer review) can trigger it when the report cannot — or
 * will no longer — reach acceptable quality. No further transitions are
 * legal once `aggregateStatus === "given-up"`.
 *
 * V2: persist `byUser` / `byRole` / `reason` as audit fields on the draft.
 */
export const giveUpDraft =
  (input: {
    draftId: string;
    byUser: number;
    byRole: ReportDraftDomainModel.ReviewerRole;
  }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());

    try {
      const draft = await deps.reportDraftsGateway.findById(input.draftId);
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
      aggregate.giveUpDraft({ byUser: input.byUser, byRole: input.byRole });

      await deps.reportDraftsGateway.save(aggregate.state);

      dispatch(reportDraftsSlice.actions.draftUpserted(aggregate.state));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
