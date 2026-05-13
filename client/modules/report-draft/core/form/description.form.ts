import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Metrics that the DESCRIPTION step gates the "Continue" button on. Only
 * `attackVector` and `privilegesRequired` are user-marked-required; the
 * other six CVSS metrics are optional at the report-drafting stage.
 *
 * Side effect: the derived CVSS vector / score / severity only render once
 * ALL eight metrics are filled (see `cvssVector`, `cvssBaseScore`). With
 * the current gate, a submitable description can carry a partial CVSS that
 * the security team completes later.
 */
const REQUIRED_FIELDS: ReadonlyArray<keyof ReportDraftDomainModel.DescriptionFields> = [
  "attackVector",
  "privilegesRequired",
];

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

  isSubmitable(state: ReportDraftDomainModel.DescriptionFields): boolean {
    return REQUIRED_FIELDS.every((key) => state[key].trim().length > 0);
  }
}
