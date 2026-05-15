import { isSubmitableForWizard } from "@modules/report-draft/core/form/form-gates";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Stateless operations on `DescriptionFields`. Instance-class shape so a
 * future dependency (validator, scoring strategy, etc.) can slot in via
 * the constructor without a call-site rewrite.
 */
export class DescriptionForm {
  setField<K extends keyof ReportDraftDomainModel.DescriptionFields>(
    state: ReportDraftDomainModel.DescriptionFields,
    key: K,
    value: ReportDraftDomainModel.DescriptionFields[K],
  ): ReportDraftDomainModel.DescriptionFields {
    return { ...state, [key]: value };
  }

  isSubmitable(_state: ReportDraftDomainModel.DescriptionFields): boolean {
    return isSubmitableForWizard();
  }
}
