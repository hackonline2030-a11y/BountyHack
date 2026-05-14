import {
  ReportDraftAggregate,
  ReviewerCommentDraft,
} from "@modules/report-draft/core/model/report-draft.aggregate";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Use case: reviewer asks the hunter for changes. Loads both the draft
 * and the submission, runs `aggregate.requestStepRevisions` (which
 * stamps every {@link ReviewerCommentDraft} with `id` + `createdAt`,
 * mutates the submission's decision to `request-changes`, and flips
 * the step to `needs-revision`), then persists draft + submission +
 * comments before mirroring the changes into the slice.
 *
 * The aggregate enforces `comments.length >= 1` — requesting revisions
 * without saying what's wrong is a domain-level error and bubbles back
 * to the UI as a failed transition.
 */
export const requestStepRevisions =
  (input: {
    draftId: string;
    submissionId: string;
    decidedBy: number;
    comments: ReadonlyArray<ReviewerCommentDraft>;
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

      const submission = await deps.submissionsGateway.findById(input.submissionId);
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
      const newComments = aggregate.requestStepRevisions({
        submission,
        decidedBy: input.decidedBy,
        comments: input.comments,
      });

      await deps.reportDraftsGateway.save(aggregate.state);
      await deps.submissionsGateway.save(submission);
      await deps.reviewerCommentsGateway.saveMany(newComments);

      dispatch(reportDraftsSlice.actions.draftUpserted(aggregate.state));
      dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
      dispatch(reportDraftsSlice.actions.commentsUpserted(newComments));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
