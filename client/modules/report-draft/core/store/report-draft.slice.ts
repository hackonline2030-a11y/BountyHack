import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ReportDraftDomainModel } from "../model/report-draft.domain-model";

export type ReportDraftFields = Record<
  ReportDraftDomainModel.ReportDraftStep,
  string
>;

const emptyFields = (): ReportDraftFields => ({
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
  fields: ReportDraftFields;
};

export const reportDraftInitialState: ReportDraftState = {
  step: ReportDraftDomainModel.ReportDraftStep.DESCRIPTION,
  fields: emptyFields(),
};

export const reportDraftSlice = createSlice({
  name: "reportDraft",
  initialState: reportDraftInitialState,
  reducers: {
    setStep: (state, action: PayloadAction<ReportDraftDomainModel.ReportDraftStep>) => {
      state.step = action.payload;
    },
    /** Saves text for the **current** step (same pattern as order: mutation then listener advances step). */
    submitStepContent: (state, action: PayloadAction<string>) => {
      state.fields[state.step] = action.payload;
    },
    resetReportDraft: () => ({
      step: ReportDraftDomainModel.ReportDraftStep.DESCRIPTION,
      fields: emptyFields(),
    }),
  },
});

export const reportDraftReducer = reportDraftSlice.reducer;
