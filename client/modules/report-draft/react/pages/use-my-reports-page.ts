"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { createReportDraft } from "@modules/report-draft/core/useCase/create-report-draft.usecase";
import { listMyDrafts } from "@modules/report-draft/core/useCase/list-my-drafts.usecase";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

/**
 * Presenter hook for the "Mes rapports" page.
 *
 * Responsibilities:
 * - Trigger `listMyDrafts({ hunterId })` once on mount (and again when the
 *   hunterId changes — e.g. account switch).
 * - Project the slice state down to a list of {@link ReportDraftDomainModel.ReportDraft}
 *   in gateway order (latest updated first).
 * - Expose a `createDraft()` callback that fires the `createReportDraft`
 *   thunk, awaits the resulting draft id, and navigates the hunter to the
 *   wizard page so they can start editing immediately.
 *
 * The hook stays UI-framework-agnostic apart from `next/navigation`'s router:
 * it doesn't render anything itself, so the page component can swap layout
 * freely without touching data flow.
 */
export type UseMyReportsPageInput = {
  hunterId: string;
  lng: string;
};

export type LoadStatus =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

export type UseMyReportsPageReturn = {
  /** Status of the initial list fetch — drives the loading/error UI. */
  loadStatus: LoadStatus;
  /** Drafts in gateway order (latest updated first). Empty while loading. */
  drafts: ReadonlyArray<ReportDraftDomainModel.ReportDraft>;
  /** Status of the in-flight "Nouveau rapport" creation, if any. */
  isCreating: boolean;
  /** Trigger the create flow; navigates to the wizard on success. */
  createDraft: () => Promise<void>;
};

export const useMyReportsPage = (
  input: UseMyReportsPageInput,
): UseMyReportsPageReturn => {
  const { hunterId, lng } = input;
  const dispatch = useAppDispatch();
  const router = useRouter();

  const list = useAppSelector((s) => s.reportDrafts.list);
  const myDraftIds = useAppSelector((s) => s.reportDrafts.myDraftIds);
  const byId = useAppSelector((s) => s.reportDrafts.byId);
  const creation = useAppSelector((s) => s.reportDrafts.creation);

  useEffect(() => {
    void dispatch(listMyDrafts({ hunterId }));
  }, [dispatch, hunterId]);

  const drafts = useMemo(
    () =>
      myDraftIds
        .map((id) => byId[id])
        .filter((d): d is ReportDraftDomainModel.ReportDraft => d !== undefined),
    [myDraftIds, byId],
  );

  const [isCreating, setIsCreating] = useState(false);

  const createDraft = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newDraftId = await dispatch(createReportDraft({ hunterId }));
      if (newDraftId !== null) {
        router.push(`/${lng}/report-draft/${newDraftId}`);
      }
    } finally {
      setIsCreating(false);
    }
  }, [dispatch, hunterId, isCreating, lng, router]);

  const loadStatus = useMemo<LoadStatus>(() => {
    if (list.status === "error") {
      return { status: "error", message: list.message };
    }
    return { status: list.status };
  }, [list]);

  return {
    loadStatus,
    drafts,
    isCreating: isCreating || creation.status === "loading",
    createDraft,
  };
};
