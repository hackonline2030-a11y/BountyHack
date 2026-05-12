import { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { ReportDraftDomainModel } from "../model/report-draft.domain-model";
import { reportDraftSlice } from "./report-draft.slice";

/**
 * Same shape as `order/core/store/fetcher.listener.ts`: react to `setStep` and trigger side effects per step.
 * Branches are intentionally empty until you wire API / prefetch (see order module for examples).
 */
export const registerReportDraftFetcherListeners = (
  listener: ListenerMiddlewareInstance,
) => {
  listener.startListening({
    actionCreator: reportDraftSlice.actions.setStep,
    effect: (action) => {
      switch (action.payload) {
        case ReportDraftDomainModel.ReportDraftStep.DESCRIPTION:
          break;
        case ReportDraftDomainModel.ReportDraftStep.COLLECTION:
          break;
        case ReportDraftDomainModel.ReportDraftStep.EXPLOITATION:
          break;
        case ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT:
          break;
        case ReportDraftDomainModel.ReportDraftStep.RISKS:
          break;
        case ReportDraftDomainModel.ReportDraftStep.REMEDIATION:
          break;
        case ReportDraftDomainModel.ReportDraftStep.FINAL:
          break;
        default:
          break;
      }
    },
  });
};
