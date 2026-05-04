import { InvalidCvTemplateError } from '../errors/invalid-cv-template.error';

export class TemplateName {
  private constructor(private readonly value: string) {}

  static create(raw: string): TemplateName {
    const normalized = (raw || '').trim();
    if (!normalized) {
      throw new InvalidCvTemplateError('CvTemplate requires a template name.');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
      throw new InvalidCvTemplateError(
        `CvTemplate templateName '${normalized}' is invalid.`,
      );
    }
    return new TemplateName(normalized);
  }

  toString(): string {
    return this.value;
  }
}
