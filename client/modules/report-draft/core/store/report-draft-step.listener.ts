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

/** Same idea as `ordering.step.listener`: react to a domain action and move the wizard forward. */
export const registerReportDraftStepListener = (
  listener: ListenerMiddlewareInstance,
) => {
  listener.startListening({
    actionCreator: reportDraftSlice.actions.submitStepContent,
    effect: (_action, api) => {
      const step = (
        api.getState() as { reportDraft: { step: ReportDraftDomainModel.ReportDraftStep } }
      ).reportDraft.step;
      const next = nextStep(step);
      if (next !== null) {
        api.dispatch(reportDraftSlice.actions.setStep(next));
      }
    },
  });
};
