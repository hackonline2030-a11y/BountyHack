import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: persist the in-progress payload of a single step (typing
 * autosave / "Continuer" button before any review submission).
 *
 * Pure edit — no transition. The aggregate's guard rejects edits on
 * locked steps (`awaiting-review` / `approved`) or on a draft in a
 * terminal state (`given-up` / `rejected` / `submitted-to-program`), so
 * the use case stays a thin orchestration layer.
 *
 * The `payload` parameter is intentionally `unknown` — the caller
 * narrows to the right per-step type (`MetaFields`, `DescriptionFields`,
 * long-form field records, …) before dispatch.
 */
export const saveStepPayload =
  (input: {
    draftId: string;
    step: ReportDraftDomainModel.ReportDraftStep;
    payload: unknown;
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
      aggregate.updateStepPayload({ step: input.step, payload: input.payload });

      await deps.reportDraftRepository.save(aggregate.state);

      dispatch(reportDraftsSlice.actions.draftUpserted(aggregate.state));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
