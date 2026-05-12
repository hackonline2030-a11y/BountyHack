import { Injectable } from '@nestjs/common';
import { constants } from 'fs';
import { access, readdir, readFile } from 'fs/promises';
import * as path from 'path';
import { IReportRepository } from '../../application/ports/report-repository.port';
import {
  InvalidTemplateNameError,
  ReportDataInvalidError,
  ReportDataMissingError,
  ReportLocaleInvalidError,
  ReportLocaleNotFoundError,
  ReportVersionInvalidError,
  ReportVersionNotFoundError,
} from '../../application/errors/pdf-application.errors';
import { ReportTemplateReadModel } from '../../application/read-models/report-template.read-model';
import { ReportTemplate } from '../../domain/entities/report-template.entity';
import { InvalidReportTemplateError } from '../../domain/errors/invalid-report-template.error';

/** `report.json` is treated as the French/default bundle (`fr`). */
const PRIMARY_REPORT_JSON_LOCALE = 'fr';

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
    if (a === PRIMARY_REPORT_JSON_LOCALE) return -1;
    if (b === PRIMARY_REPORT_JSON_LOCALE) return 1;
    return a.localeCompare(b);
  });

const VERSION_SLUG_PATTERN = /^v\d+$/;
const STYLE_SLUG_PATTERN = /^[a-z0-9_-]+$/i;

@Injectable()
export class JsonReportRepositoryAdapter implements IReportRepository {
  private readonly dataRootDir = path.resolve(
    process.cwd(),
    'src',
    'document-rendering',
    'data',
  );

  /** Root-relative paths — resolve against the browser origin instead of in-container PORT. */
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

  async listReportStyles(): Promise<string[]> {
    const allStyles = await this.listStyleDirectoryNames();
    const out: string[] = [];
    for (const style of allStyles) {
      if ((await this.listReportVersions(style)).length > 0) {
        out.push(style);
      }
    }
    return out;
  }

  async listReportVersions(style: string): Promise<string[]> {
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

    const populated: string[] = [];
    for (const ver of sorted) {
      const versionDir = path.join(styleDir, ver);
      const locales = await this.listDocumentLocalesForDirectory(versionDir);
      if (locales.length > 0) {
        populated.push(ver);
      }
    }

    return populated;
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
    return this.listDocumentLocalesForDirectory(versionDir);
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
  ): Promise<string[]> {
    const baseName = 'report';
    let names: string[];
    try {
      names = await readdir(versionDirectoryPath);
    } catch {
      return [];
    }

    const locales: string[] = [];
    const basePath = path.join(versionDirectoryPath, `${baseName}.json`);

    if (await pathExists(basePath)) {
      locales.push(PRIMARY_REPORT_JSON_LOCALE);
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
    localeNotFoundErrorFactory: (locale: string, version: string) => Error,
  ): Promise<string> {
    const baseName = 'report';
    const base = path.join(versionDirectoryPath, `${baseName}.json`);

    if (locale === PRIMARY_REPORT_JSON_LOCALE) {
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
      return 'report-final';
    }

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
}
