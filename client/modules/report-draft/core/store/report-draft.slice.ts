import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { DescriptionFactory } from "@modules/report-draft/core/model/description.factory";
import { MetaFactory } from "@modules/report-draft/core/model/meta.factory";
import { ReportDraftDomainModel } from "../model/report-draft.domain-model";
import { clampHunterWizardStep } from "../model/hunter-wizard-steps";

export type ReportDraftFields = Record<
  ReportDraftDomainModel.ReportDraftStep,
  string
>;

const emptyFields = (): ReportDraftFields => ({
  [ReportDraftDomainModel.ReportDraftStep.META]: "",
  [ReportDraftDomainModel.ReportDraftStep.DESCRIPTION]: "",
  [ReportDraftDomainModel.ReportDraftStep.COLLECTION]: "",
  [ReportDraftDomainModel.ReportDraftStep.EXPLOITATION]: "",
  [ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT]: "",
  [ReportDraftDomainModel.ReportDraftStep.RISKS]: "",
  [ReportDraftDomainModel.ReportDraftStep.REMEDIATION]: "",
  [ReportDraftDomainModel.ReportDraftStep.FINAL]: "",
});

export type ReportDraftState = {
  step: ReportDraftDomainModel.ReportDraftStep;
  /**
   * Free-form textarea content for every step that hasn't been migrated to a
   * structured form yet. META's slot here is intentionally kept (and empty)
   * so the textarea-step rendering can stay generic; the real META payload
   * lives in `meta`.
   */
  fields: ReportDraftFields;
  /** Structured META payload (see `MetaFields` in the domain model). */
  meta: ReportDraftDomainModel.MetaFields;
  /** Structured DESCRIPTION payload — the 8 CVSS 3.1 base metrics. */
  description: ReportDraftDomainModel.DescriptionFields;
};

export const reportDraftInitialState: ReportDraftState = {
  step: ReportDraftDomainModel.ReportDraftStep.META,
  fields: emptyFields(),
  meta: MetaFactory.create(),
  description: DescriptionFactory.create(),
};

export const reportDraftSlice = createSlice({
  name: "reportDraft",
  initialState: reportDraftInitialState,
  reducers: {
    setStep: (state, action: PayloadAction<ReportDraftDomainModel.ReportDraftStep>) => {
      state.step = clampHunterWizardStep(action.payload);
    },
    /** Saves text for the **current** step (same pattern as order: mutation then listener advances step). */
    submitStepContent: (state, action: PayloadAction<string>) => {
      state.fields[state.step] = action.payload;
    },
    /**
     * Commits the META structured payload. The step listener observes this
     * action and dispatches `setStep(DESCRIPTION)` to advance the wizard.
     */
    submitMeta: (state, action: PayloadAction<ReportDraftDomainModel.MetaFields>) => {
      state.meta = action.payload;
    },
    /**
     * Commits the DESCRIPTION structured payload (the 8 CVSS 3.1 base
     * metrics). The step listener observes this action and dispatches
     * `setStep(COLLECTION)` to advance the wizard.
     */
    submitDescription: (
      state,
      action: PayloadAction<ReportDraftDomainModel.DescriptionFields>,
    ) => {
      state.description = action.payload;
    },
    resetReportDraft: () => ({
      step: ReportDraftDomainModel.ReportDraftStep.META,
      fields: emptyFields(),
      meta: MetaFactory.create(),
      description: DescriptionFactory.create(),
    }),
  },
});

export const reportDraftReducer = reportDraftSlice.reducer;
