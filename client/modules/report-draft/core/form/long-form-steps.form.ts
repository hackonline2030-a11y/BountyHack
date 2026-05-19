import { isSubmitableForWizard } from "@modules/report-draft/core/form/form-gates";
import type { ReportDraftDomainModel as M } from "@modules/report-draft/core/model/report-draft.domain-model";

export function isLongFormStepSubmitable(_payload: M.LongFormStepPayload): boolean {
  return isSubmitableForWizard();
}
