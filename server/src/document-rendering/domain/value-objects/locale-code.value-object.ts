import { InvalidCvTemplateError } from '../errors/invalid-cv-template.error';

export class LocaleCode {
  private constructor(private readonly value: string) {}

  static create(raw: string): LocaleCode {
    const normalized = (raw || '').trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(normalized)) {
      throw new InvalidCvTemplateError(
        `CvTemplate htmlLang '${raw}' is invalid.`,
      );
    }
    return new LocaleCode(normalized);
  }

  toString(): string {
    return this.value;
  }
}
