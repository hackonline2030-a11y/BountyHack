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
    return {
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
      ...data,
    };
  }
}
