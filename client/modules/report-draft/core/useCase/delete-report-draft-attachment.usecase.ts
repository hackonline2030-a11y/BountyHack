import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const deleteReportDraftAttachment =
  (input: {
    draftId: ReportDraftDomainModel.ReportDraftId;
    attachmentId: string;
  }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());
    try {
      const draft = await deps.reportDraftRepository.deleteAttachment(input);
      dispatch(reportDraftsSlice.actions.draftUpserted(draft));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      dispatch(
        reportDraftsSlice.actions.transitionFailed({
          message:
            error instanceof Error
              ? error.message
              : "Impossible de supprimer la pièce jointe.",
        }),
      );
    }
  };
