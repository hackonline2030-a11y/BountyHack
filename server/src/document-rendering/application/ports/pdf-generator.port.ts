export const I_PDF_GENERATOR = 'I_PDF_GENERATOR';

export interface IPdfGenerator {
  generateFromHtml(htmlContent: string): Promise<Buffer>;
}
