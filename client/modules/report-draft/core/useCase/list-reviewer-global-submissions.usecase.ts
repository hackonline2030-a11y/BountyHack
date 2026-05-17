import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { Dependencies } from "@store/dependencies";
import { AppDispatch } from "@store/redux/store";

export const listReviewerGlobalSubmissions =
  (input: { reviewerRole: ReportDraftDomainModel.ReviewerRole }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportDraftsSlice.actions.globalReviewListStarted());

    try {
      const items = await deps.globalSubmissionRepository.findAllForReviewerRole(
        input.reviewerRole,
      );
      for (const g of items) {
        dispatch(reportDraftsSlice.actions.globalSubmissionUpserted(g));
      }
      dispatch(
        reportDraftsSlice.actions.globalReviewListSucceeded({
          globalSubmissionIds: items.map((g) => g.id),
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.globalReviewListFailed({ message }));
    }
  };
