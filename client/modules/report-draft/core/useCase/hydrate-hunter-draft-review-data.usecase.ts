import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { Dependencies } from "@modules/store/dependencies";
import { AppDispatch } from "@store/redux/store";

/**
 * Loads submissions + reviewer comments for each hunter-owned draft id so that
 * “Mes rapports” can show review activity without opening each report first.
 * Idempotent upserts into `reportDrafts` slice.
 */
export const hydrateHunterDraftReviewData =
  (input: { draftIds: readonly string[] }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    const ids = [...new Set(input.draftIds.filter((id) => id.trim().length > 0))];
    await Promise.all(
      ids.map(async (draftId) => {
        try {
          const subs = await deps.submissionRepository.findByDraftId(draftId);
          for (const sub of subs) {
            dispatch(reportDraftsSlice.actions.submissionUpserted(sub));
            const comments =
              await deps.reviewerCommentRepository.findBySubmissionId(sub.id);
            if (comments.length > 0) {
              dispatch(reportDraftsSlice.actions.commentsUpserted(comments));
            }
          }
        } catch {
          // Secondary data: other drafts may still load; a single failure should not break the list.
        }
      }),
    );
  };
