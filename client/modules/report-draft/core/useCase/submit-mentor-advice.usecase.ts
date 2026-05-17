import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Optional mentor advice — snapshots the step for the mentor without locking
 * the hunter form or gating « Suivant » (only QC approval does).
 */
export const submitMentorAdvice =
  (input: {
    draftId: string;
    step: ReportDraftDomainModel.ReportDraftStep;
    submittedBy: string;
    payload?: unknown;
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
      if (input.payload !== undefined) {
        aggregate.updateStepPayload({ step: input.step, payload: input.payload });
      }
      const submission = aggregate.submitMentorAdvice({
        step: input.step,
        submittedBy: input.submittedBy,
      });

      await deps.reportDraftRepository.save(aggregate.state);
      await deps.submissionRepository.save(submission);

      dispatch(reportDraftsSlice.actions.draftUpserted(aggregate.state));
      dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
