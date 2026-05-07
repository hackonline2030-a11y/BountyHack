import { CvTemplate } from '../../domain/entities/cv-template.entity';

export const I_CV_REPOSITORY = 'I_CV_REPOSITORY';

/** Whether a data folder under `<style>/<version>/` is CV or report JSON-driven. */
export type DashboardDocumentKind = 'cv' | 'report';

export interface DocumentLocalesResolution {
  documentKind: DashboardDocumentKind;
  locales: string[];
}

export interface ICvRepository {
  /** Style slugs discovered under `src/document-rendering/data/<style>/<version>/cv.json` (e.g. `red-squared`, `hetic-squared`). */
  listCvStyles(): Promise<string[]>;

  /** Sorted version slugs (`v1`, `v2`, …) for one style folder. */
  listCvVersions(style: string): Promise<string[]>;

  /** Two-letter language codes (`fr` from `cv.json`, plus `cv.en.json`, …) for one style/version folder. */
  listCvLocales(style: string, version: string): Promise<string[]>;

  /**
   * Locales for dashboard preview: uses `cv.json` / `cv.<lang>.json` if present, otherwise
   * `report.json` / `report.<lang>.json`. CV wins when both define at least one locale file.
   */
  listLocalesForDashboard(
    style: string,
    version: string,
  ): Promise<DocumentLocalesResolution>;

  /**
   * @param style - When omitted, the first folder from {@link listCvStyles} is used.
   * @param version - When omitted, the first folder from {@link listCvVersions} is used.
   * @param locale - When omitted, the preferred default for that folder (French `fr` first if present).
   */
  getCvTemplateData(style?: string, version?: string, locale?: string): Promise<CvTemplate>;
}
