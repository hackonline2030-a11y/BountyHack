import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@store/dependencies";
import { AppDispatch, AppGetState } from "@store/redux/store";

/** QC dashboard: mentor advisory threads on the same report teams (read-only section). */
export const listMentorPeerSubmissionsForQc =
  () =>
  async (
    dispatch: AppDispatch,
    _getState: AppGetState,
    deps: Dependencies,
  ): Promise<void> => {
    try {
      const submissions =
        await deps.submissionRepository.findMentorPeerSubmissionsForQc();

      const draftIds = new Set(submissions.map((s) => s.reportDraftId));
      for (const draftId of draftIds) {
        try {
          const draft = await deps.reportDraftRepository.findById(draftId);
          if (draft) {
            dispatch(reportDraftsSlice.actions.draftUpserted(draft));
          }
        } catch {
          // keep row with fallback title
        }
      }

      for (const submission of submissions) {
        dispatch(reportDraftsSlice.actions.submissionUpserted(submission));
      }

      dispatch(
        reportDraftsSlice.actions.mentorPeerListSucceeded({
          submissionIds: submissions.map((s) => s.id),
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.mentorPeerListFailed({ message }));
    }
  };
