"use client";

import { useCallback } from "react";
import { useStore } from "react-redux";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { saveStepPayload } from "@modules/report-draft/core/useCase/save-step-payload.usecase";
import { useAppDispatch } from "@store/redux/store";
import type { AppState } from "@store/redux/store";

function stepPayloadsEqual(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

type Args = {
  draftId: string | null | undefined;
  step: ReportDraftDomainModel.ReportDraftStep;
  localPayload: unknown;
  persistedPayload: unknown;
  /** Step editable by workflow + designated writer. */
  canSave: boolean;
};

/**
 * Persists the in-progress step payload via {@link saveStepPayload} without
 * changing step status. Used by « Enregistrer le brouillon », Suivant, and Retour.
 */
export const useReportDraftStepSave = ({
  draftId,
  step,
  localPayload,
  persistedPayload,
  canSave,
}: Args) => {
  const dispatch = useAppDispatch();
  const store = useStore<AppState>();

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!draftId || !canSave) return false;
    if (stepPayloadsEqual(localPayload, persistedPayload)) return true;

    await dispatch(
      saveStepPayload({ draftId, step, payload: localPayload }),
    );
    const { transition } = store.getState().reportDrafts;
    return transition.status === "success";
  }, [
    draftId,
    canSave,
    localPayload,
    persistedPayload,
    step,
    dispatch,
    store,
  ]);

  const persistThen = useCallback(
    async (run: () => void): Promise<void> => {
      if (canSave && draftId) {
        const ok = await saveDraft();
        if (!ok) return;
      }
      run();
    },
    [canSave, draftId, saveDraft],
  );

  const hasUnsavedChanges =
    canSave &&
    draftId != null &&
    !stepPayloadsEqual(localPayload, persistedPayload);

  return { saveDraft, persistThen, hasUnsavedChanges };
};
