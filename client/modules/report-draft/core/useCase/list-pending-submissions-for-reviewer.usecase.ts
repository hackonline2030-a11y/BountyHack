import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * Quality-checker (or any reviewer role): list submissions awaiting a decision.
 */
export const listPendingSubmissionsForReviewer =
  (input: { reviewerRole: ReportDraftDomainModel.ReviewerRole }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.reviewListStarted());

    try {
      const submissions = await deps.submissionRepository.findPendingForReviewerRole(
        input.reviewerRole,
      );

      for (const submission of submissions) {
        dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
        const draft = await deps.reportDraftRepository.findById(submission.reportDraftId);
        if (draft) {
          dispatch(reportDraftsSlice.actions.draftUpserted(draft));
        }
      }

      dispatch(
        reportDraftsSlice.actions.reviewListSucceeded({
          submissionIds: submissions.map((s) => s.id),
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.reviewListFailed({ message }));
    }
  };
