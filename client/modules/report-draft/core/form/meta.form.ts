import { isSubmitableForWizard } from "@modules/report-draft/core/form/form-gates";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Stateless operations on `MetaFields`. Instance-class shape (rather than
 * static methods) so a future dependency (id provider, validator, etc.)
 * can slot in via the constructor without a call-site rewrite.
 *
 * `setField` returns a new object — a top-level field update is shallow
 * enough that `immer` would be overkill. `isSubmitable` is the gate the
 * META section uses to enable the "Continue" button.
 */
export class MetaForm {
  setField<K extends keyof ReportDraftDomainModel.MetaFields>(
    state: ReportDraftDomainModel.MetaFields,
    key: K,
    value: ReportDraftDomainModel.MetaFields[K],
  ): ReportDraftDomainModel.MetaFields {
    return { ...state, [key]: value };
  }

  isSubmitable(_state: ReportDraftDomainModel.MetaFields): boolean {
    return isSubmitableForWizard();
  }
}
