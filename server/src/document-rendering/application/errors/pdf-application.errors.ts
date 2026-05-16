export class TemplateNotFoundError extends Error {
  constructor(templatePath: string) {
    super(`Template file '${templatePath}' not found.`);
  }
}

export class InvalidTemplateNameError extends Error {
  constructor(templateName: string) {
    super(
      `Invalid template '${templateName}' in report.json. Use a template module name like 'report-final' only (no leading '/', no nested path).`,
    );
  }
}

export class PdfGenerationFailedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ReportDataInvalidError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ReportVersionInvalidError extends Error {
  constructor(public readonly version: string) {
    super(
      `Invalid report version '${version}'. Expected a folder slug like 'v1' or 'v2'.`,
    );
  }
}

export class ReportVersionNotFoundError extends Error {
  constructor(public readonly version: string) {
    super(
      `Report version '${version}' was not found (no report.json under that folder).`,
    );
  }
}

export class ReportDataMissingError extends Error {
  constructor(baseDir: string) {
    super(
      `No report version folders with report.json were found under '${baseDir}'.`,
    );
  }
}

export class ReportLocaleInvalidError extends Error {
  constructor(public readonly locale: string) {
    super(
      `Invalid report language '${locale}'. Use a two-letter code like 'fr' or 'en'.`,
    );
  }
}

export class ReportLocaleNotFoundError extends Error {
  constructor(public readonly locale: string, public readonly version: string) {
    super(
      `Report language '${locale}' is not available for version '${version}' (missing report.<lang>.json or report.json).`,
    );
  }
}
