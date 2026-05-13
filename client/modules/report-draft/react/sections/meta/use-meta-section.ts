"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BUG_TYPES } from "@modules/report-draft/core/catalog/bug-types.catalog";
import {
  SCOPES,
  SCOPE_OTHER_VALUE,
} from "@modules/report-draft/core/catalog/scopes.catalog";
import { VULNERABLE_PARTS } from "@modules/report-draft/core/catalog/vulnerable-parts.catalog";
import { MetaForm } from "@modules/report-draft/core/form/meta.form";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { submitMeta } from "@modules/report-draft/core/useCase/submit-meta.usecase";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

/**
 * Presenter hook for the META section. Owns the local draft, exposes typed
 * setters, computes the "submitable" gate, and surfaces the dispatchers the
 * section needs to advance, retreat, or reset.
 *
 * The draft is held locally (not in Redux) until the user clicks
 * "Continue" — same idea as the textarea step in the existing wizard: keep
 * keystroke-level state in React, flush to the store only on submit.
 */
export const useMetaSection = () => {
  const dispatch = useAppDispatch();
  const stateMeta = useAppSelector((s) => s.reportDraft.meta);

  const form = useMemo(() => new MetaForm(), []);

  const [draft, setDraft] = useState<ReportDraftDomainModel.MetaFields>(stateMeta);

  useEffect(() => {
    setDraft(stateMeta);
  }, [stateMeta]);

  const setField = useCallback(
    <K extends keyof ReportDraftDomainModel.MetaFields>(
      key: K,
      value: ReportDraftDomainModel.MetaFields[K],
    ) => {
      setDraft((current) => form.setField(current, key, value));
    },
    [form],
  );

  const isSubmitable = useMemo(() => form.isSubmitable(draft), [form, draft]);

  const onContinue = useCallback(() => {
    if (!isSubmitable) return;
    dispatch(submitMeta(draft));
  }, [dispatch, draft, isSubmitable]);

  const onReset = useCallback(() => {
    dispatch(reportDraftSlice.actions.resetReportDraft());
  }, [dispatch]);

  return {
    draft,
    setField,
    isSubmitable,
    onContinue,
    onReset,
    catalogs: {
      bugTypes: BUG_TYPES,
      scopes: SCOPES,
      scopeOtherValue: SCOPE_OTHER_VALUE,
      vulnerableParts: VULNERABLE_PARTS,
    },
  };
};
