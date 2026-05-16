import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * Default-builder for `MetaFields`. A single static `create` that returns
 * a fresh object with every field zeroed-out, optionally overridden by a
 * partial.
 *
 * Used by the slice's initial state and by `resetReportDraft` — keep it the
 * single source of truth for "what an empty META looks like".
 */
export class MetaFactory {
  static create(
    data?: Partial<ReportDraftDomainModel.MetaFields>,
  ): ReportDraftDomainModel.MetaFields {
    const defaults: ReportDraftDomainModel.MetaFields = {
      reportTitle: "",
      bugType: "",
      scopeSlug: "",
      endpoint: "",
      vulnerablePartCategory: "",
      vulnerablePartName: "",
      payload: "",
      technicalEnvironment: "",
      applicationFingerprint: "",
      cve: "",
      impact: "",
      ipsUsed: "",
    };
    if (!data) {
      return defaults;
    }
    const out = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof ReportDraftDomainModel.MetaFields)[]) {
      const v = data[key];
      if (v !== undefined && v !== null) {
        out[key] = v;
      }
    }
    return out;
  }
}
