import { InvalidReportTemplateError } from '../errors/invalid-report-template.error';

export class TemplateName {
  private constructor(private readonly value: string) {}

  static create(raw: string): TemplateName {
    const normalized = (raw || '').trim();
    if (!normalized) {
      throw new InvalidReportTemplateError('ReportTemplate requires a template name.');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
      throw new InvalidReportTemplateError(
        `ReportTemplate templateName '${normalized}' is invalid.`,
      );
    }
    return new TemplateName(normalized);
  }

  toString(): string {
    return this.value;
  }
}
