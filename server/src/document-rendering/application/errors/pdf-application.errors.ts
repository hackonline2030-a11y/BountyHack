export class TemplateNotFoundError extends Error {
  constructor(templatePath: string) {
    super(`Template file '${templatePath}' not found.`);
  }
}

export class InvalidTemplateNameError extends Error {
  constructor(templateName: string) {
    super(
      `Invalid template '${templateName}' in cv.json. Use a template module name like 'red-squared' only (no leading '/', no nested path like 'assets/red-squared').`,
    );
  }
}

export class CvDataInvalidError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/** Version slug format is `v` + digits, e.g. `v1`, `v12`. */
export class CvVersionInvalidError extends Error {
  constructor(public readonly version: string) {
    super(
      `Invalid CV version '${version}'. Expected a folder slug like 'v1' or 'v2'.`,
    );
  }
}

export class CvVersionNotFoundError extends Error {
  constructor(public readonly version: string) {
    super(`CV version '${version}' was not found (no cv.json under that folder).`);
  }
}

export class CvDataMissingError extends Error {
  constructor(baseDir: string) {
    super(
      `No CV version folders with cv.json were found under '${baseDir}'. Create 'src/document-rendering/data/v1/cv.json' or similar.`,
    );
  }
}

/** Two-letter language code (e.g. en, fr). */
export class CvLocaleInvalidError extends Error {
  constructor(public readonly locale: string) {
    super(
      `Invalid CV language '${locale}'. Use a two-letter code like 'fr' or 'en'.`,
    );
  }
}

export class CvLocaleNotFoundError extends Error {
  constructor(public readonly locale: string, public readonly version: string) {
    super(
      `CV language '${locale}' is not available for version '${version}' (missing cv.<lang>.json or cv.json).`,
    );
  }
}

export class PdfGenerationFailedError extends Error {
  constructor(message: string) {
    super(message);
  }
}
