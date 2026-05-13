import { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { ReportDraftDomainModel } from "../model/report-draft.domain-model";
import { reportDraftSlice } from "./report-draft.slice";

const nextStep = (
  current: ReportDraftDomainModel.ReportDraftStep,
): ReportDraftDomainModel.ReportDraftStep | null => {
  if (current >= ReportDraftDomainModel.ReportDraftStep.FINAL) {
    return null;
  }
  return (current + 1) as ReportDraftDomainModel.ReportDraftStep;
};

type StateSlice = { reportDraft: { step: ReportDraftDomainModel.ReportDraftStep } };

const advance = (api: { getState: () => unknown; dispatch: (a: unknown) => unknown }) => {
  const step = (api.getState() as StateSlice).reportDraft.step;
  const next = nextStep(step);
  if (next !== null) {
    api.dispatch(reportDraftSlice.actions.setStep(next));
  }
};

/** React to a domain submit action and move the wizard forward to the next step. */
export const registerReportDraftStepListener = (
  listener: ListenerMiddlewareInstance,
) => {
  listener.startListening({
    actionCreator: reportDraftSlice.actions.submitStepContent,
    effect: (_action, api) => advance(api),
  });

  listener.startListening({
    actionCreator: reportDraftSlice.actions.submitMeta,
    effect: (_action, api) => advance(api),
  });

  listener.startListening({
    actionCreator: reportDraftSlice.actions.submitDescription,
    effect: (_action, api) => advance(api),
  });
};
