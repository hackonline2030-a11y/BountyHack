"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ATTACK_COMPLEXITY_OPTIONS,
  ATTACK_VECTOR_OPTIONS,
  CIA_IMPACT_OPTIONS,
  PRIVILEGES_REQUIRED_OPTIONS,
  SCOPE_OPTIONS,
  USER_INTERACTION_OPTIONS,
} from "@modules/report-draft/core/catalog/cvss-metrics.catalog";
import {
  cvssBaseScore,
  cvssSeverity,
  cvssVector,
} from "@modules/report-draft/core/cvss/cvss-3.1";
import { DescriptionForm } from "@modules/report-draft/core/form/description.form";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftSlice } from "@modules/report-draft/core/store/report-draft.slice";
import { submitDescription } from "@modules/report-draft/core/useCase/submit-description.usecase";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

/**
 * Presenter hook for the DESCRIPTION section. Owns the local draft of the 8
 * CVSS base metrics, exposes typed setters, computes the derived CVSS
 * (vector / score / severity) live, and surfaces the dispatchers the
 * section needs to advance, retreat, or reset.
 *
 * The draft is held locally (not in Redux) until the user clicks
 * "Continue" — same idea as the META section: keep keystroke-level state in
 * React, flush to the store only on submit.
 */
export const useDescriptionSection = () => {
  const dispatch = useAppDispatch();
  const stateDescription = useAppSelector((s) => s.reportDraft.description);
  const metaScopeSlug = useAppSelector((s) => s.reportDraft.meta.scopeSlug);

  const form = useMemo(() => new DescriptionForm(), []);

  const [draft, setDraft] =
    useState<ReportDraftDomainModel.DescriptionFields>(stateDescription);

  useEffect(() => {
    setDraft(stateDescription);
  }, [stateDescription]);

  const setField = useCallback(
    <K extends keyof ReportDraftDomainModel.DescriptionFields>(
      key: K,
      value: ReportDraftDomainModel.DescriptionFields[K],
    ) => {
      setDraft((current) => form.setField(current, key, value));
    },
    [form],
  );

  const isSubmitable = useMemo(() => form.isSubmitable(draft), [form, draft]);

  const derivedVector = useMemo(() => cvssVector(draft), [draft]);
  const derivedScore = useMemo(() => cvssBaseScore(draft), [draft]);
  const derivedSeverity = useMemo(() => cvssSeverity(derivedScore), [derivedScore]);

  const onContinue = useCallback(() => {
    if (!isSubmitable) return;
    dispatch(submitDescription(draft));
  }, [dispatch, draft, isSubmitable]);

  const onBack = useCallback(() => {
    dispatch(
      reportDraftSlice.actions.setStep(ReportDraftDomainModel.ReportDraftStep.META),
    );
  }, [dispatch]);

  const onReset = useCallback(() => {
    dispatch(reportDraftSlice.actions.resetReportDraft());
  }, [dispatch]);

  return {
    draft,
    setField,
    isSubmitable,
    onContinue,
    onBack,
    onReset,
    derived: {
      vector: derivedVector,
      score: derivedScore,
      severity: derivedSeverity,
    },
    metaScopeSlug,
    catalogs: {
      attackVector: ATTACK_VECTOR_OPTIONS,
      attackComplexity: ATTACK_COMPLEXITY_OPTIONS,
      privilegesRequired: PRIVILEGES_REQUIRED_OPTIONS,
      userInteraction: USER_INTERACTION_OPTIONS,
      scope: SCOPE_OPTIONS,
      ciaImpact: CIA_IMPACT_OPTIONS,
    },
  };
};
