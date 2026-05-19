import { fetchBff } from "@/lib/bff-fetch";
import { readFriendlyHttpError } from "@/lib/http-error-message";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import type { ReportDraftStepStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { parseJsonResponse } from "@modules/report-draft/core/repository-infra/http-json";
import { loadReportDraft } from "@modules/report-draft/core/useCase/load-report-draft.usecase";
import { AppDispatch } from "@store/redux/store";

export type SuperAdminStepCommentInput = {
  step: ReportDraftStepStateKey;
  body: string;
};

export const saveSuperAdminStepComments =
  (input: { draftId: string; comments: ReadonlyArray<SuperAdminStepCommentInput> }) =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());
    try {
      const res = await fetchBff(
        `/api/report-draft/admin/drafts/${encodeURIComponent(input.draftId)}/super-admin-comments`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments: input.comments }),
        },
      );
      if (!res.ok) {
        throw new Error(
          await readFriendlyHttpError(res, "Impossible d’enregistrer les commentaires."),
        );
      }
      const saved = (await parseJsonResponse(
        res,
      )) as ReportDraftDomainModel.ReviewerComment[];
      if (saved.length > 0) {
        dispatch(reportDraftsSlice.actions.commentsUpserted(saved));
      }
      await dispatch(loadReportDraft({ draftId: input.draftId }));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
