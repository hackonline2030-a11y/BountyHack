export class InvalidCvTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCvTemplateError';
  }
}
