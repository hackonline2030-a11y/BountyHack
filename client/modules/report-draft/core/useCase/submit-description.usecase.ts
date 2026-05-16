import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import type { AppDispatch } from "@store/redux/store";

/**
 * Thin user-intent wrapper around the slice action: a single dispatch with
 * a domain-named function so call sites read declaratively.
 *
 * The step advance (DESCRIPTION -> COLLECTION) is handled by the
 * report-draft step listener observing this slice action — keep the
 * use-case dispatch-only.
 */
export const submitDescription =
  (description: ReportDraftDomainModel.DescriptionFields) =>
  (dispatch: AppDispatch) => {
    dispatch(reportDraftSlice.actions.submitDescription(description));
  };
