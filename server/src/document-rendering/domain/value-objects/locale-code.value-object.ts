import { InvalidReportTemplateError } from '../errors/invalid-report-template.error';

export class LocaleCode {
  private constructor(private readonly value: string) {}

  static create(raw: string): LocaleCode {
    const normalized = (raw || '').trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(normalized)) {
      throw new InvalidReportTemplateError(
        `ReportTemplate htmlLang '${raw}' is invalid.`,
      );
    }
    return new LocaleCode(normalized);
  }

  toString(): string {
    return this.value;
  }
}
