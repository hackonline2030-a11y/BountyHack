import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Hunter submits the whole draft as one global submission for QC (after
 * super-admin global revision). Persists the open step, then creates the
 * global submission row on the server.
 */
export const submitDraftGloballyForReview =
  (input: {
    draftId: string;
    currentStep?: ReportDraftDomainModel.ReportDraftStep;
    currentPayload?: unknown;
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

      if (
        input.currentStep !== undefined &&
        input.currentPayload !== undefined
      ) {
        aggregate.updateStepPayload({
          step: input.currentStep,
          payload: input.currentPayload,
        });
        await deps.reportDraftRepository.save(aggregate.state);
      }

      const globalSubmissions = await deps.globalSubmissionRepository.create({
        draftId: input.draftId,
      });

      const refreshed = await deps.reportDraftRepository.findById(input.draftId);

      for (const globalSubmission of globalSubmissions) {
        dispatch(reportDraftsSlice.actions.globalSubmissionUpserted(globalSubmission));
      }
      if (refreshed) {
        dispatch(reportDraftsSlice.actions.draftUpserted(refreshed));
      }
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
