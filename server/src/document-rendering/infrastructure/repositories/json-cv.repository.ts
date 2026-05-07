import { Injectable } from '@nestjs/common';
import { constants } from 'fs';
import { access, readdir, readFile } from 'fs/promises';
import * as path from 'path';
import {
  DocumentLocalesResolution,
  ICvRepository,
} from '../../application/ports/cv-repository.port';
import { IReportRepository } from '../../application/ports/report-repository.port';
import {
  CvContactRow,
  CvGithubFooter,
  CvProfileLink,
  CvProjectBlock,
  CvSectionHeadings,
  CvTemplateLabels,
  CvTemplateReadModel,
} from '../../application/read-models/cv-template.read-model';
import { CvTemplate } from '../../domain/entities/cv-template.entity';
import { ReportTemplate } from '../../domain/entities/report-template.entity';
import { InvalidCvTemplateError } from '../../domain/errors/invalid-cv-template.error';
import { InvalidReportTemplateError } from '../../domain/errors/invalid-report-template.error';
import {
  CvDataInvalidError,
  CvDataMissingError,
  CvLocaleInvalidError,
  CvLocaleNotFoundError,
  CvVersionInvalidError,
  CvVersionNotFoundError,
  InvalidTemplateNameError,
  ReportDataInvalidError,
  ReportDataMissingError,
  ReportLocaleInvalidError,
  ReportLocaleNotFoundError,
  ReportVersionInvalidError,
  ReportVersionNotFoundError,
} from '../../application/errors/pdf-application.errors';
import { ReportTemplateReadModel } from '../../application/read-models/report-template.read-model';

/** `cv.json`/`report.json` is treated as the French/default bundle (`fr`). */
const PRIMARY_CV_JSON_LOCALE = 'fr';

const LOCALE_CODE_PATTERN = /^[a-z]{2}$/;
const buildSideFileRegex = (baseName: string) =>
  new RegExp(`^${baseName}\\.([a-z]{2})\\.json$`, 'i');

async function pathExists(candidate: string): Promise<boolean> {
  try {
    await access(candidate, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const sortLocales = (locales: Iterable<string>): string[] =>
  [...new Set(locales)].sort((a, b) => {
    if (a === PRIMARY_CV_JSON_LOCALE) return -1;
    if (b === PRIMARY_CV_JSON_LOCALE) return 1;
    return a.localeCompare(b);
  });

type CvJson = {
  content?: {
    template?: string;
    bullets?: boolean;
    bulletStyle?: string;
    bulletsColor?: string;
    basics?: {
      name?: string;
      headline?: string;
      phone?: string;
      email?: string;
      summary?: string;
      photoFileName?: string;
    };
    location?: {
      city?: string;
      region?: string;
      country?: string;
    };
    profiles?: Array<{ network?: string; url?: string; username?: string }>;
    work?: Array<{
      name?: string;
      link?: string;
      section?: 'experience' | 'previous-experience';
      order?: number;
      position?: string;
      /** When set (e.g. hackathon range), replaces auto-built period label. */
      periodLabel?: string;
      startDate?: string;
      endDate?: string;
      summary?:
        | string
        | {
            intro?: string;
            list?: string[];
          };
    }>;
    education?: Array<{
      institution?: string;
      degreeName?: string;
      link?: string;
      area?: string;
      periodLabel?: string;
      startDate?: string;
      endDate?: string;
      summary?:
        | string
        | {
            intro?: string;
            list?: string[];
          };
    }>;
    languages?: Array<{
      language?: string;
      fluency?: string;
      keywords?: string[];
    }>;
    skills?: Array<{ name?: string; skills?: string[]; keywords?: string[] }>;
    interests?: Array<{ name?: string; keywords?: string[] }>;
    volunteer?: Array<{
      organization?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
      summary?: string;
    }>;
    /** HetIC-style layout overrides (hetic-squared template). */
    sectionHeadings?: Partial<CvSectionHeadings>;
    contactRows?: Array<{ icon?: string; text?: string }>;
    profileLinks?: Array<{ label?: string; url?: string }>;
    projects?: Array<{
      title?: string;
      lines?: Array<{ lead?: string; body?: string }>;
    }>;
    githubFooter?: CvGithubFooter;
  };
  locale?: { language?: string };
  layouts?: unknown[];
  /** UI copy for section titles and template fallbacks — required; supply per locale file. */
  labels?: unknown;
};

const CV_TEMPLATE_LABEL_KEYS: (keyof CvTemplateLabels)[] = [
  'languages',
  'interests',
  'experience',
  'education',
  'previousExperience',
  'placeholderFullName',
  'placeholderJobTitle',
  'portfolioFallback',
  'skillGroupFallback',
  'roleFallback',
  'profilePhotoAlt',
];

function parseCvTemplateLabelsFromJson(
  raw: unknown,
  sourcePath: string,
): CvTemplateLabels {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new CvDataInvalidError(
      `Missing object 'labels' in '${sourcePath}'. Add a "labels" block with all template strings (see docs or v1/cv.json).`,
    );
  }
  const o = raw as Record<string, unknown>;
  const out = {} as CvTemplateLabels;
  for (const key of CV_TEMPLATE_LABEL_KEYS) {
    const v = o[key];
    if (typeof v !== 'string' || !v.trim()) {
      throw new CvDataInvalidError(
        `Missing or invalid labels.${String(key)} (non-empty string required) in '${sourcePath}'.`,
      );
    }
    out[key] = v.trim();
  }
  return out;
}

const splitSummary = (value = ''): string[] =>
  value
    .split('\n')
    .map((line) => line.replace(/^-+\s*/, '').trim())
    .filter(Boolean);

const normalizeSummary = (
  summary: string | { intro?: string; list?: string[] } | undefined,
): { intro: string; list: string[] } => {
  if (!summary) {
    return { intro: '', list: [] };
  }

  if (typeof summary === 'string') {
    return { intro: '', list: splitSummary(summary) };
  }

  return {
    intro: (summary.intro || '').trim(),
    list: (summary.list || []).map((item) => item.trim()).filter(Boolean),
  };
};

const buildPeriod = (
  localeCode: string,
  startDate = '',
  endDate = '',
): string => {
  const ongoing = localeCode === 'en' ? 'Present' : "Aujourd'hui";
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (startDate) return `${startDate} - ${ongoing}`;
  return endDate;
};

const normalizeBulletStyle = (
  bulletStyle: string | undefined,
  bullets: boolean | undefined,
): 'dot' | 'dash' | 'none' => {
  if (bullets === false) {
    return 'none';
  }

  if (bulletStyle === 'dash' || bulletStyle === 'none' || bulletStyle === 'dot') {
    return bulletStyle;
  }

  return 'dot';
};

const normalizeBulletsColor = (bulletsColor: string | undefined): string => {
  const color = (bulletsColor || '').trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : '';
};

const isPreviousWork = (item: {
  section?: 'experience' | 'previous-experience';
}): boolean => {
  return item.section === 'previous-experience';
};

const DEFAULT_HETIC_HEADINGS: CvSectionHeadings = {
  profile: 'Profil',
  contact: 'Coordonnées',
  competencies: 'Compétences',
  language: 'Langue',
  activities: 'Activités et loisirs',
  projects: 'Mes projets',
};

function normalizeContactIcon(raw?: string): CvContactRow['icon'] {
  const s = (raw || '').toLowerCase().trim();
  if (s === 'tel' || s === 'phone' || s === 'mobile') return 'phone';
  if (
    s === 'location' ||
    s === 'map' ||
    s === 'address' ||
    s === 'home'
  )
    return 'map';
  return 'mail';
}

function normalizeContactRows(
  rows?: Array<{ icon?: string; text?: string }>,
): CvContactRow[] | undefined {
  if (!rows?.length) return undefined;
  const out = rows
    .map((row) => ({
      icon: normalizeContactIcon(row.icon),
      text: (row.text || '').trim(),
    }))
    .filter((r) => r.text);
  return out.length ? out : undefined;
}

function fallbackHeticContactRows(
  basics: { email?: string; phone?: string },
  locationText: string,
): CvContactRow[] | undefined {
  const out: CvContactRow[] = [];
  const email = (basics.email || '').trim();
  const phone = (basics.phone || '').trim();
  const addr = (locationText || '').trim();
  if (email) out.push({ icon: 'mail', text: email });
  if (phone) out.push({ icon: 'phone', text: phone });
  if (addr) out.push({ icon: 'map', text: addr });
  return out.length ? out : undefined;
}

function normalizeProfileLinks(
  raw?: Array<{ label?: string; url?: string }>,
): CvProfileLink[] | undefined {
  if (!raw?.length) return undefined;
  const out = raw
    .map((p) => ({
      label: (p.label || 'Lien').trim(),
      url: (p.url || '').trim(),
    }))
    .filter((p) => p.url);
  return out.length ? out : undefined;
}

function normalizeProjectsFromJson(
  raw?: Array<{
    title?: string;
    lines?: Array<{ lead?: string; body?: string }>;
  }>,
): CvProjectBlock[] | undefined {
  if (!raw?.length) return undefined;
  const out = raw
    .map((p) => ({
      title: (p.title || '').trim(),
      lines: (p.lines || [])
        .map((line) => ({
          lead: (line.lead || '').trim() || undefined,
          body: (line.body || '').trim(),
        }))
        .filter((line) => line.body),
    }))
    .filter((p) => p.title);
  return out.length ? out : undefined;
}

function normalizeGithubFooterFromJson(raw?: {
  text?: string;
  url?: string;
}): CvGithubFooter | undefined {
  const text = (raw?.text || '').trim();
  if (!text) return undefined;
  const url = (raw?.url || '').trim();
  return { text, url: url || undefined };
}

function mergeSectionHeadings(
  templateName: string,
  partial?: Partial<CvSectionHeadings>,
): CvSectionHeadings | undefined {
  if (templateName !== 'hetic-squared') return undefined;
  const pick = (
    key: keyof CvSectionHeadings,
    fallback: string,
  ): string => {
    const raw = partial?.[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    return fallback;
  };

  return {
    profile: pick('profile', DEFAULT_HETIC_HEADINGS.profile),
    contact: pick('contact', DEFAULT_HETIC_HEADINGS.contact),
    competencies: pick('competencies', DEFAULT_HETIC_HEADINGS.competencies),
    language: pick('language', DEFAULT_HETIC_HEADINGS.language),
    activities: pick('activities', DEFAULT_HETIC_HEADINGS.activities),
    projects: pick('projects', DEFAULT_HETIC_HEADINGS.projects),
  };
}

const sortByOrder = <T extends { order?: number; endDate?: string }>(items: T[]): T[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      // Primary default order is JSON appearance; "order" overrides it when present.
      const aOrder = Number.isFinite(a.item.order)
        ? (a.item.order as number)
        : a.index + 1;
      const bOrder = Number.isFinite(b.item.order)
        ? (b.item.order as number)
        : b.index + 1;
      if (aOrder !== bOrder) return aOrder - bOrder;

      return a.index - b.index;
    })
    .map((entry) => entry.item);

const VERSION_SLUG_PATTERN = /^v\d+$/;
const STYLE_SLUG_PATTERN = /^[a-z0-9_-]+$/i;

@Injectable()
export class JsonCvRepositoryAdapter implements ICvRepository, IReportRepository {
  private readonly dataRootDir = path.resolve(
    process.cwd(),
    'src',
    'document-rendering',
    'data',
  );

  /** Root-relative paths — resolve against the browser origin (e.g. host port 3003) instead of in-container PORT. */
  private readonly templateAssetsBasePath = '/template-assets';

  private async listStyleDirectoryNames(): Promise<string[]> {
    let rootEntries;
    try {
      rootEntries = await readdir(this.dataRootDir, { withFileTypes: true });
    } catch {
      return [];
    }

    return rootEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name.trim().toLowerCase())
      .filter((name) => STYLE_SLUG_PATTERN.test(name))
      .sort((a, b) => a.localeCompare(b));
  }

  async listCvStyles(): Promise<string[]> {
    return this.listStyleDirectoryNames();
  }

  async listCvVersions(style: string): Promise<string[]> {
    const trimmedStyle = typeof style === 'string' ? style.trim().toLowerCase() : '';
    if (!STYLE_SLUG_PATTERN.test(trimmedStyle)) {
      return [];
    }

    const styleDir = path.join(this.dataRootDir, trimmedStyle);
    let entries;
    try {
      entries = await readdir(styleDir, { withFileTypes: true });
    } catch {
      return [];
    }

    const versions = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name.trim().toLowerCase())
      .filter((name) => VERSION_SLUG_PATTERN.test(name));

    const sorted = Array.from(new Set<string>(versions)).sort(
      (a, b) =>
        Number.parseInt(a.slice(1), 10) - Number.parseInt(b.slice(1), 10),
    );

    /** Only versions that contain `cv*` or `report*` locale files (avoids empty `v*` folders). */
    const populated: string[] = [];
    for (const ver of sorted) {
      const { locales } = await this.listLocalesForDashboard(trimmedStyle, ver);
      if (locales.length > 0) {
        populated.push(ver);
      }
    }

    return populated;
  }

  async listCvLocales(style: string, version: string): Promise<string[]> {
    const trimmedStyle = typeof style === 'string' ? style.trim().toLowerCase() : '';
    if (!STYLE_SLUG_PATTERN.test(trimmedStyle)) {
      return [];
    }

    const trimmed = typeof version === 'string' ? version.trim() : '';
    if (!VERSION_SLUG_PATTERN.test(trimmed.toLowerCase())) {
      throw new CvVersionInvalidError(trimmed);
    }

    const resolvedVersion = trimmed.toLowerCase();
    const versionDir = path.join(this.dataRootDir, trimmedStyle, resolvedVersion);
    return this.listDocumentLocalesForDirectory(versionDir, 'cv');
  }

  async listLocalesForDashboard(
    style: string,
    version: string,
  ): Promise<DocumentLocalesResolution> {
    const trimmedStyle = typeof style === 'string' ? style.trim().toLowerCase() : '';
    if (!STYLE_SLUG_PATTERN.test(trimmedStyle)) {
      return { documentKind: 'cv', locales: [] };
    }

    const trimmed = typeof version === 'string' ? version.trim() : '';
    if (!VERSION_SLUG_PATTERN.test(trimmed.toLowerCase())) {
      throw new CvVersionInvalidError(trimmed);
    }

    const resolvedVersion = trimmed.toLowerCase();
    const versionDir = path.join(this.dataRootDir, trimmedStyle, resolvedVersion);

    const cvLocales = await this.listDocumentLocalesForDirectory(versionDir, 'cv');
    if (cvLocales.length > 0) {
      return { documentKind: 'cv', locales: cvLocales };
    }

    const reportLocales = await this.listDocumentLocalesForDirectory(
      versionDir,
      'report',
    );
    if (reportLocales.length > 0) {
      return { documentKind: 'report', locales: reportLocales };
    }

    return { documentKind: 'cv', locales: [] };
  }

  async listReportStyles(): Promise<string[]> {
    return this.listStyleDirectoryNames();
  }

  async listReportVersions(style: string): Promise<string[]> {
    // Same folder strategy as CV (`<style>/<version>/...`).
    return this.listCvVersions(style);
  }

  async listReportLocales(style: string, version: string): Promise<string[]> {
    const trimmedStyle = typeof style === 'string' ? style.trim().toLowerCase() : '';
    if (!STYLE_SLUG_PATTERN.test(trimmedStyle)) {
      return [];
    }

    const trimmed = typeof version === 'string' ? version.trim() : '';
    if (!VERSION_SLUG_PATTERN.test(trimmed.toLowerCase())) {
      throw new ReportVersionInvalidError(trimmed);
    }

    const resolvedVersion = trimmed.toLowerCase();
    const versionDir = path.join(this.dataRootDir, trimmedStyle, resolvedVersion);
    return this.listDocumentLocalesForDirectory(versionDir, 'report');
  }

  async getCvTemplateData(
    style?: string,
    version?: string,
    locale?: string,
  ): Promise<CvTemplate> {
    const styles = await this.listCvStyles();
    if (!styles.length) {
      throw new CvDataMissingError(this.dataRootDir);
    }

    const requestedStyle = typeof style === 'string' ? style.trim() : '';
    const normalizedStyle =
      requestedStyle === '' ? undefined : requestedStyle.toLowerCase();
    if (
      normalizedStyle !== undefined &&
      !STYLE_SLUG_PATTERN.test(normalizedStyle)
    ) {
      throw new CvDataInvalidError(
        `Invalid CV style '${requestedStyle}'. Use a slug like 'red-curb' or 'hetic-squared'.`,
      );
    }
    const defaultStyle = styles[0];
    if (defaultStyle === undefined) {
      throw new CvDataMissingError(this.dataRootDir);
    }
    let resolvedStyle = normalizedStyle ?? defaultStyle;
    if (!styles.includes(resolvedStyle)) {
      throw new CvDataInvalidError(
        `CV style '${resolvedStyle}' not found under '${this.dataRootDir}'.`,
      );
    }

    const requestedVersion =
      typeof version === 'string' ? version.trim() : '';
    const normalizedVersion =
      requestedVersion === '' ? undefined : requestedVersion.toLowerCase();

    if (
      normalizedVersion !== undefined &&
      !VERSION_SLUG_PATTERN.test(normalizedVersion)
    ) {
      throw new CvVersionInvalidError(normalizedVersion);
    }

    const styleCandidates = normalizedStyle ? [resolvedStyle] : styles;

    let resolvedVersion: string | undefined;
    let versionDirectoryPath: string | undefined;
    let availableLocales: string[] = [];

    for (const candidateStyle of styleCandidates) {
      const versions = await this.listCvVersions(candidateStyle);
      if (!versions.length) continue;

      const firstVersion = versions[0];
      if (firstVersion === undefined) {
        continue;
      }
      const candidateVersion = normalizedVersion ?? firstVersion;
      if (!versions.includes(candidateVersion)) continue;

      const candidateDir = path.join(
        this.dataRootDir,
        candidateStyle,
        candidateVersion,
      );
      const candidateLocales = await this.listDocumentLocalesForDirectory(
        candidateDir,
        'cv',
      );
      if (!candidateLocales.length) continue;

      resolvedVersion = candidateVersion;
      resolvedStyle = candidateStyle;
      versionDirectoryPath = candidateDir;
      availableLocales = candidateLocales;
      break;
    }

    if (!resolvedVersion || !versionDirectoryPath) {
      if (normalizedVersion) {
        throw new CvVersionNotFoundError(normalizedVersion);
      }
      throw new CvDataInvalidError(
        `Expected at least cv.json or cv.<lang>.json in '${resolvedStyle}/<version>'.`,
      );
    }

    const rawLocale =
      typeof locale === 'string' ? locale.trim().toLowerCase() : '';

    let resolvedLocale: string;

    if (rawLocale === '') {
      const firstAvail = availableLocales[0];
      if (firstAvail === undefined) {
        throw new CvDataInvalidError(
          `No locale entry files under resolved CV version directory.`,
        );
      }
      resolvedLocale = firstAvail;
    } else {
      if (!LOCALE_CODE_PATTERN.test(rawLocale)) {
        throw new CvLocaleInvalidError(locale ?? '');
      }
      resolvedLocale = rawLocale;
    }

    if (!availableLocales.includes(resolvedLocale)) {
      throw new CvLocaleNotFoundError(resolvedLocale, resolvedVersion);
    }

    const cvAbsolutePath = await this.resolveDocumentJsonAbsolutePath(
      versionDirectoryPath,
      resolvedVersion,
      resolvedLocale,
      'cv',
      (loc, ver) => new CvLocaleNotFoundError(loc, ver),
    );

    let fileContent: string;
    try {
      fileContent = await readFile(cvAbsolutePath, 'utf-8');
    } catch {
      throw new CvLocaleNotFoundError(resolvedLocale, resolvedVersion);
    }

    let cvJson: CvJson;
    try {
      cvJson = JSON.parse(fileContent) as CvJson;
    } catch {
      throw new CvDataInvalidError(
        `Invalid JSON format in '${cvAbsolutePath}'.`,
      );
    }

    try {
      return CvTemplate.create(
        this.mapCvToTemplateData(cvJson, resolvedLocale, cvAbsolutePath),
      );
    } catch (error) {
      if (error instanceof InvalidCvTemplateError) {
        throw new CvDataInvalidError(
          `Invalid CV template data in '${cvAbsolutePath}': ${error.message}`,
        );
      }
      throw error;
    }
  }

  async getReportTemplateData(
    style?: string,
    version?: string,
    locale?: string,
  ): Promise<ReportTemplate> {
    const styles = await this.listReportStyles();
    if (!styles.length) {
      throw new ReportDataMissingError(this.dataRootDir);
    }

    const requestedStyle = typeof style === 'string' ? style.trim() : '';
    const normalizedStyle =
      requestedStyle === '' ? undefined : requestedStyle.toLowerCase();
    if (
      normalizedStyle !== undefined &&
      !STYLE_SLUG_PATTERN.test(normalizedStyle)
    ) {
      throw new ReportDataInvalidError(
        `Invalid report style '${requestedStyle}'. Use a slug like 'report-final'.`,
      );
    }

    let resolvedStyle = normalizedStyle ?? styles[0]!;
    if (!styles.includes(resolvedStyle)) {
      throw new ReportDataInvalidError(
        `Report style '${resolvedStyle}' not found under '${this.dataRootDir}'.`,
      );
    }

    const requestedVersion =
      typeof version === 'string' ? version.trim() : '';
    const normalizedVersion =
      requestedVersion === '' ? undefined : requestedVersion.toLowerCase();

    if (
      normalizedVersion !== undefined &&
      !VERSION_SLUG_PATTERN.test(normalizedVersion)
    ) {
      throw new ReportVersionInvalidError(normalizedVersion);
    }

    const styleCandidates = normalizedStyle ? [resolvedStyle] : styles;
    let resolvedVersion: string | undefined;
    let versionDirectoryPath: string | undefined;
    let availableLocales: string[] = [];

    for (const candidateStyle of styleCandidates) {
      const versions = await this.listReportVersions(candidateStyle);
      if (!versions.length) continue;

      const candidateVersion = normalizedVersion ?? versions[0]!;
      if (!versions.includes(candidateVersion)) continue;

      const candidateDir = path.join(
        this.dataRootDir,
        candidateStyle,
        candidateVersion,
      );
      const candidateLocales = await this.listDocumentLocalesForDirectory(
        candidateDir,
        'report',
      );
      if (!candidateLocales.length) continue;

      resolvedVersion = candidateVersion;
      resolvedStyle = candidateStyle;
      versionDirectoryPath = candidateDir;
      availableLocales = candidateLocales;
      break;
    }

    if (!resolvedVersion || !versionDirectoryPath) {
      if (normalizedVersion) {
        throw new ReportVersionNotFoundError(normalizedVersion);
      }
      throw new ReportDataInvalidError(
        `Expected at least report.json or report.<lang>.json in '${resolvedStyle}/<version>'.`,
      );
    }

    const rawLocale =
      typeof locale === 'string' ? locale.trim().toLowerCase() : '';
    let resolvedLocale: string;
    if (rawLocale === '') {
      resolvedLocale = availableLocales[0]!;
    } else {
      if (!LOCALE_CODE_PATTERN.test(rawLocale)) {
        throw new ReportLocaleInvalidError(locale ?? '');
      }
      resolvedLocale = rawLocale;
    }

    if (!availableLocales.includes(resolvedLocale)) {
      throw new ReportLocaleNotFoundError(resolvedLocale, resolvedVersion);
    }

    const reportAbsolutePath = await this.resolveDocumentJsonAbsolutePath(
      versionDirectoryPath,
      resolvedVersion,
      resolvedLocale,
      'report',
      (loc, ver) => new ReportLocaleNotFoundError(loc, ver),
    );

    let fileContent: string;
    try {
      fileContent = await readFile(reportAbsolutePath, 'utf-8');
    } catch {
      throw new ReportLocaleNotFoundError(resolvedLocale, resolvedVersion);
    }

    let reportJson: Record<string, unknown>;
    try {
      reportJson = JSON.parse(fileContent) as Record<string, unknown>;
    } catch {
      throw new ReportDataInvalidError(
        `Invalid JSON format in '${reportAbsolutePath}'.`,
      );
    }

    try {
      return ReportTemplate.create(
        this.mapReportToTemplateData(
          reportJson,
          resolvedLocale,
          reportAbsolutePath,
        ),
      );
    } catch (error) {
      if (error instanceof InvalidReportTemplateError) {
        throw new ReportDataInvalidError(
          `Invalid report template data in '${reportAbsolutePath}': ${error.message}`,
        );
      }
      throw error;
    }
  }

  private async listDocumentLocalesForDirectory(
    versionDirectoryPath: string,
    baseName: 'cv' | 'report',
  ): Promise<string[]> {
    let names: string[];
    try {
      names = await readdir(versionDirectoryPath);
    } catch {
      return [];
    }

    const locales: string[] = [];
    const basePath = path.join(versionDirectoryPath, `${baseName}.json`);

    if (await pathExists(basePath)) {
      locales.push(PRIMARY_CV_JSON_LOCALE);
    }

    for (const name of names) {
      const match = buildSideFileRegex(baseName).exec(name);
      if (match?.[1]) {
        locales.push(match[1].toLowerCase());
      }
    }

    return sortLocales(locales);
  }

  private async resolveDocumentJsonAbsolutePath(
    versionDirectoryPath: string,
    resolvedVersion: string,
    locale: string,
    baseName: 'cv' | 'report',
    localeNotFoundErrorFactory: (locale: string, version: string) => Error,
  ): Promise<string> {
    const base = path.join(versionDirectoryPath, `${baseName}.json`);

    if (locale === PRIMARY_CV_JSON_LOCALE) {
      const explicitFr = path.join(versionDirectoryPath, `${baseName}.fr.json`);

      if (await pathExists(base)) {
        return base;
      }
      if (await pathExists(explicitFr)) {
        return explicitFr;
      }
      throw localeNotFoundErrorFactory(locale, resolvedVersion);
    }

    const side = path.join(versionDirectoryPath, `${baseName}.${locale}.json`);
    if (await pathExists(side)) {
      return side;
    }

    throw localeNotFoundErrorFactory(locale, resolvedVersion);
  }

  private validateTemplateName(rawTemplateName: string): string {
    const templateName = (rawTemplateName || '').trim();
    if (!templateName) {
      return 'red-squared';
    }

    // Strict module-name format: letters, numbers, underscores, dashes only.
    if (!/^[a-zA-Z0-9_-]+$/.test(templateName)) {
      throw new InvalidTemplateNameError(templateName);
    }

    return templateName;
  }

  private mapReportToTemplateData(
    report: Record<string, unknown>,
    localeCode: string,
    sourcePath: string,
  ): ReportTemplateReadModel {
    const labelsRaw = report['labels'];
    const contentRaw = report['content'];
    if (!contentRaw || typeof contentRaw !== 'object' || Array.isArray(contentRaw)) {
      throw new ReportDataInvalidError(
        `Missing object 'content' in '${sourcePath}'.`,
      );
    }
    const content = contentRaw as Record<string, unknown>;
    const templateName = this.validateTemplateName(
      String(content['template'] || 'report-final'),
    );

    return {
      htmlLang: localeCode,
      language: String(content['language'] || localeCode),
      templateName,
      templateStylesheetUrl: `${this.templateAssetsBasePath}/${templateName}/styles/styles.css`,
      labels:
        labelsRaw && typeof labelsRaw === 'object' && !Array.isArray(labelsRaw)
          ? (labelsRaw as Record<string, string>)
          : {},
      author:
        content['author'] && typeof content['author'] === 'object'
          ? (content['author'] as Record<string, unknown>)
          : {},
      reportMeta:
        content['reportMeta'] && typeof content['reportMeta'] === 'object'
          ? (content['reportMeta'] as Record<string, unknown>)
          : {},
      summaryPage:
        content['summaryPage'] && typeof content['summaryPage'] === 'object'
          ? (content['summaryPage'] as Record<string, unknown>)
          : {},
      tableOfContents: Array.isArray(content['tableOfContents'])
        ? (content['tableOfContents'] as Array<Record<string, unknown>>)
        : [],
      sections: Array.isArray(content['sections'])
        ? (content['sections'] as Array<Record<string, unknown>>)
        : [],
      bugDetails:
        content['bugDetails'] && typeof content['bugDetails'] === 'object'
          ? (content['bugDetails'] as Record<string, unknown>)
          : {},
      bugCharacteristics:
        content['bugCharacteristics'] &&
        typeof content['bugCharacteristics'] === 'object'
          ? (content['bugCharacteristics'] as Record<string, unknown>)
          : {},
      bugDescription:
        content['bugDescription'] && typeof content['bugDescription'] === 'object'
          ? (content['bugDescription'] as Record<string, unknown>)
          : {},
      attachments:
        content['attachments'] && typeof content['attachments'] === 'object'
          ? (content['attachments'] as Record<string, unknown>)
          : {},
      bugChain:
        content['bugChain'] && typeof content['bugChain'] === 'object'
          ? (content['bugChain'] as Record<string, unknown>)
          : {},
    };
  }

  private mapCvToTemplateData(
    cv: CvJson,
    localeCode: string,
    sourcePath: string,
  ): CvTemplateReadModel {
    const labels = parseCvTemplateLabelsFromJson(cv.labels, sourcePath);

    const content = cv.content || {};
    const templateName = this.validateTemplateName(content.template || '');
    const basics = content.basics || {};
    const location = content.location || {};
    const profiles = content.profiles || [];
    const work = content.work || [];
    const education = content.education || [];
    const languages = content.languages || [];
    const skills = content.skills || [];
    const interests = content.interests || [];
    const volunteer = content.volunteer || [];

    const locationText = [location.city, location.region, location.country]
      .filter(Boolean)
      .join(' - ');
    const portfolioProfile =
      profiles.find((p) => (p.network || '').toLowerCase() === 'portfolio') ||
      profiles[0];

    const headings = mergeSectionHeadings(
      templateName,
      content.sectionHeadings,
    );
    const contactRowsResolved =
      normalizeContactRows(content.contactRows) ??
      (templateName === 'hetic-squared'
        ? fallbackHeticContactRows(basics, locationText)
        : undefined);
    const profileLinks = normalizeProfileLinks(content.profileLinks);
    const projects = normalizeProjectsFromJson(content.projects);
    const githubFooter = normalizeGithubFooterFromJson(content.githubFooter);

    const currentWork = sortByOrder(work.filter((item) => !isPreviousWork(item)));
    const previousWork = sortByOrder(work.filter((item) => isPreviousWork(item)));
    const photoFileName =
      (basics.photoFileName || '').replace(/[^a-zA-Z0-9._-]/g, '') || 'logo.png';

    return {
      htmlLang: localeCode,
      labels,
      templateName,
      templateStylesheetUrl: `${this.templateAssetsBasePath}/${templateName}/styles/styles.css`,
      bullets: content.bullets !== false,
      bulletStyle: normalizeBulletStyle(content.bulletStyle, content.bullets),
      bulletsColor: normalizeBulletsColor(content.bulletsColor),
      fullName: basics.name || labels.placeholderFullName,
      jobTitle: basics.headline || labels.placeholderJobTitle,
      summary: basics.summary || '',
      profileImage: `${this.templateAssetsBasePath}/${templateName}/assets/${photoFileName}`,
      headings,
      profileLinks,
      contactRows: contactRowsResolved,
      leftColumn: {
        portfolio: {
          label:
            portfolioProfile?.network || labels.portfolioFallback,
          url: portfolioProfile?.url || '',
        },
        contact: [basics.email, basics.phone, locationText].filter(Boolean),
        skills: skills.map((skill) => ({
          title: skill.name || labels.skillGroupFallback,
          items: skill.skills || skill.keywords || [],
        })),
        languages: languages
          .flatMap((langRow) => [
            [langRow.language, langRow.fluency].filter(Boolean).join(' : '),
            ...(langRow.keywords || []),
          ])
          .filter(Boolean),
        interests: [
          ...interests.flatMap((item) => item.keywords || []),
          ...volunteer.map((item) =>
            [item.organization, item.position].filter(Boolean).join(' : '),
          ),
        ].filter(Boolean),
      },
      rightColumn: {
        experiences: currentWork.map((item) => {
          const workSummary = normalizeSummary(item.summary);
          return {
            title: item.position || labels.roleFallback,
            company: item.name || '',
            companyLink: (item.link || '').trim(),
            period:
              (item.periodLabel || '').trim() ||
              buildPeriod(localeCode, item.startDate, item.endDate),
            intro: workSummary.intro,
            items: workSummary.list,
          };
        }),
        formations: education.map((item) => {
          const educationSummary = normalizeSummary(item.summary);
          return {
            degreeName: item.degreeName || item.area || '',
            degreeLink: (item.link || '').trim(),
            period:
              (item.periodLabel || '').trim() ||
              buildPeriod(localeCode, item.startDate, item.endDate),
            school: item.institution || '',
            intro: educationSummary.intro,
            items: educationSummary.list,
          };
        }),
        previousExperiences: previousWork.map((item) => {
          const workSummary = normalizeSummary(item.summary);
          return {
            title: item.position || labels.roleFallback,
            period:
              (item.periodLabel || '').trim() ||
              buildPeriod(localeCode, item.startDate, item.endDate),
            company: item.name || '',
            companyLink: (item.link || '').trim(),
            intro: workSummary.intro,
            items: workSummary.list,
          };
        }),
        projects,
        githubFooter,
      },
    };
  }
}
