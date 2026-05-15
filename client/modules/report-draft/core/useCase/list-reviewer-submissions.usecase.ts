import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/**
 * QC dashboard: every submission round for this reviewer role (pending,
 * approved, revisions requested, etc.) — one table row per submission id.
 */
export const listReviewerSubmissions =
  (input: { reviewerRole: ReportDraftDomainModel.ReviewerRole }) =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    dispatch(reportDraftsSlice.actions.reviewListStarted());

    try {
      const submissions = await deps.submissionRepository.findAllForReviewerRole(
        input.reviewerRole,
      );

      const draftIds = new Set(submissions.map((s) => s.reportDraftId));
      for (const draftId of draftIds) {
        const draft = await deps.reportDraftRepository.findById(draftId);
        if (draft) {
          dispatch(reportDraftsSlice.actions.draftUpserted(draft));
        }
      }

      for (const submission of submissions) {
        dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
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
