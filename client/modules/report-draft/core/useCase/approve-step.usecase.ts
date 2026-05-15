import { ReportDraftAggregate } from "@modules/report-draft/core/model/report-draft.aggregate";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: reviewer approves a pending submission. Loads both the
 * draft and the submission, runs `aggregate.approveStep` (which mutates
 * the submission in place — `decision = approve`, `decidedAt`,
 * `decidedBy` — and flips the step to `approved`, possibly promoting
 * the whole draft to `ready-to-program` when every step is approved),
 * then persists both entities and mirrors them into the slice.
 */
export const approveStep =
  (input: { draftId: string; submissionId: string; decidedBy: string }) =>
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

      const submission = await deps.submissionRepository.findById(input.submissionId);
      if (submission === null) {
        dispatch(
          reportDraftsSlice.actions.transitionFailed({
            message: `Submission '${input.submissionId}' not found.`,
          }),
        );
        return;
      }

      const aggregate = new ReportDraftAggregate(draft, {
        idProvider: deps.idProvider,
        clock: deps.clock,
      });
      aggregate.approveStep({ submission, decidedBy: input.decidedBy });

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
