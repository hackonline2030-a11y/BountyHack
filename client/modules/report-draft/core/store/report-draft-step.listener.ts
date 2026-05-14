import { ListenerMiddlewareInstance } from "@reduxjs/toolkit";

/**
 * Historically auto-advanced the wizard after `submitStepContent` /
 * `submitMeta` / `submitDescription`. Each step is now an explicit form:
 * presenters call `saveStepPayload` + `setStep` (Suivant) or
 * `submitStepForReview` (soumission revue) themselves — no listener hooks
 * remain here.
 */
export const registerReportDraftStepListener = (
  _listener: ListenerMiddlewareInstance,
) => {};
