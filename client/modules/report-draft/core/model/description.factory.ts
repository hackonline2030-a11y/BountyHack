import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { normalizeSectionBlocs } from "@modules/report-draft/core/model/section-bloc";

/**
 * Default-builder for `DescriptionFields`. Every metric starts empty (the
 * empty string acts as "not selected yet" — `cvssBaseScore` returns `null`
 * in that case so the UI can show "N/A" instead of a fake 0.0).
 *
 * Used by the slice's initial state and by `resetReportDraft`.
 */
export class DescriptionFactory {
  static create(
    data?: Partial<ReportDraftDomainModel.DescriptionFields>,
  ): ReportDraftDomainModel.DescriptionFields {
    const { sectionBlocs: rawBlocs, ...rest } = data ?? {};
    return {
      attackVector: "",
      attackComplexity: "",
      privilegesRequired: "",
      userInteraction: "",
      scope: "",
      confidentiality: "",
      integrity: "",
      availability: "",
      sectionBlocs: rawBlocs ? normalizeSectionBlocs(rawBlocs) : [],
      ...rest,
    };
  }
}

/** Normalizes persisted or API description payload (CVSS + section blocs). */
export function normalizeDescriptionPayload(raw: unknown): ReportDraftDomainModel.DescriptionFields {
  if (!raw || typeof raw !== "object") {
    return DescriptionFactory.create();
  }
  return DescriptionFactory.create(raw as Partial<ReportDraftDomainModel.DescriptionFields>);
}
