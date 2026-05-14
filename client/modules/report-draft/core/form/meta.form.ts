import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * The required-fields rule for the META step. Touching this list is the
 * intended way to make a field mandatory or optional — UI + slice both
 * defer to `MetaForm.isSubmitable`.
 */
const REQUIRED_FIELDS: ReadonlyArray<keyof ReportDraftDomainModel.MetaFields> = [
  "reportTitle",
  "bugType",
  "scopeSlug",
  "endpoint",
  "vulnerablePartCategory",
  "vulnerablePartName",
  "payload",
  "technicalEnvironment",
  "ipsUsed",
];

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

  isSubmitable(state: ReportDraftDomainModel.MetaFields): boolean {
    return REQUIRED_FIELDS.every((key) => state[key].trim().length > 0);
  }
}
