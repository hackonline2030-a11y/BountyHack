"use client";

import { useEffect, useMemo } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { hydrateHunterDraftReviewData } from "@modules/report-draft/core/useCase/hydrate-hunter-draft-review-data.usecase";
import { listMyDrafts } from "@modules/report-draft/core/useCase/list-my-drafts.usecase";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

/**
 * Presenter hook for the "Mes rapports" page: load the hunter’s drafts and
 * hydrate review activity (submissions + comments) for the dashboard.
 */
export type UseMyReportsPageInput = {
  hunterId: string;
};

export type LoadStatus =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

export type UseMyReportsPageReturn = {
  loadStatus: LoadStatus;
  drafts: ReadonlyArray<ReportDraftDomainModel.ReportDraft>;
};

export const useMyReportsPage = (
  input: UseMyReportsPageInput,
): UseMyReportsPageReturn => {
  const { hunterId } = input;
  const dispatch = useAppDispatch();

  const list = useAppSelector((s) => s.reportDrafts.list);
  const myDraftIds = useAppSelector((s) => s.reportDrafts.myDraftIds);
  const byId = useAppSelector((s) => s.reportDrafts.byId);

  useEffect(() => {
    void dispatch(listMyDrafts({ hunterId }));
  }, [dispatch, hunterId]);

  useEffect(() => {
    if (list.status !== "success" || myDraftIds.length === 0) return;
    void dispatch(hydrateHunterDraftReviewData({ draftIds: myDraftIds }));
  }, [dispatch, list.status, myDraftIds]);

  const drafts = useMemo(
    () =>
      myDraftIds
        .map((id) => byId[id])
        .filter((d): d is ReportDraftDomainModel.ReportDraft => d !== undefined),
    [myDraftIds, byId],
  );

  const loadStatus = useMemo<LoadStatus>(() => {
    if (list.status === "error") {
      return { status: "error", message: list.message };
    }
    return { status: list.status };
  }, [list]);

  return {
    loadStatus,
    drafts,
  };
};
