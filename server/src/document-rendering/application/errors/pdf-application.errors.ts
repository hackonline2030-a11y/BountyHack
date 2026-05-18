export class TemplateNotFoundError extends Error {
  constructor(templatePath: string) {
    super(`Template file '${templatePath}' not found.`);
  }
}

export class InvalidTemplateNameError extends Error {
  constructor(templateName: string) {
    super(
      `Invalid template '${templateName}'. Use a template module name like 'report-final' only.`,
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

export class ReportIdInvalidError extends Error {
  constructor(public readonly reportId: string) {
    super(`Invalid report id '${reportId}'.`);
  }
}

export class ReportNotFoundError extends Error {
  constructor(public readonly reportId: string) {
    super(`Report '${reportId}' was not found or has no frozen content.`);
  }
}

export class ReportLocaleInvalidError extends Error {
  constructor(public readonly locale: string) {
    super(
      `Invalid report language '${locale}'. Use a two-letter code like 'fr' or 'en'.`,
    );
  }
}

/** @deprecated File-based locales removed; kept for controller mapping compatibility. */
export class ReportVersionInvalidError extends Error {
  constructor(public readonly version: string) {
    super(`Invalid report version '${version}'.`);
  }
}

/** @deprecated */
export class ReportVersionNotFoundError extends Error {
  constructor(public readonly version: string) {
    super(`Report version '${version}' was not found.`);
  }
}

/** @deprecated */
export class ReportDataMissingError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/** @deprecated */
export class ReportLocaleNotFoundError extends Error {
  constructor(public readonly locale: string, public readonly version: string) {
    super(
      `Report language '${locale}' is not available for version '${version}'.`,
    );
  }
}
