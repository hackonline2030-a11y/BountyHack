import { ListenerMiddlewareInstance } from "@reduxjs/toolkit";
import { ReportDraftDomainModel } from "../model/report-draft.domain-model";
import { reportDraftSlice } from "./report-draft.slice";

/**
 * React to `setStep` and trigger side effects per step (data prefetch,
 * background syncs, etc.). Branches are intentionally empty until the
 * per-step fetchers are wired.
 */
export const registerReportDraftFetcherListeners = (
  listener: ListenerMiddlewareInstance,
) => {
  listener.startListening({
    actionCreator: reportDraftSlice.actions.setStep,
    effect: (action) => {
      switch (action.payload) {
        case ReportDraftDomainModel.ReportDraftStep.META:
          break;
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
