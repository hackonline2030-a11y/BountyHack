export const I_PDF_STORAGE = 'I_PDF_STORAGE';

export interface SavePdfResult {
  fileName: string;
  publicUrl: string;
}

export interface IPdfStorage {
  savePdf(pdfBuffer: Buffer, templateName: string): Promise<SavePdfResult>;
}
