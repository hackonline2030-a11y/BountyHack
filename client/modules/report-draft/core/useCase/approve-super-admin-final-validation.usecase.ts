import { fetchBff } from "@/lib/bff-fetch";
import { readFriendlyHttpError } from "@/lib/http-error-message";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { parseJsonResponse } from "@modules/report-draft/core/repository-infra/http-json";
import { AppDispatch } from "@store/redux/store";

export const approveSuperAdminFinalValidation =
  (input: { draftId: string }) =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(reportDraftsSlice.actions.transitionStarted());
    try {
      const res = await fetchBff(
        `/api/report-draft/admin/drafts/${encodeURIComponent(input.draftId)}/final-validate`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(
          await readFriendlyHttpError(res, "Impossible d’approuver la validation finale."),
        );
      }
      const draft = (await parseJsonResponse(res)) as ReportDraftDomainModel.ReportDraft;
      dispatch(reportDraftsSlice.actions.draftUpserted(draft));
      dispatch(reportDraftsSlice.actions.transitionSucceeded());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportDraftsSlice.actions.transitionFailed({ message }));
    }
  };
