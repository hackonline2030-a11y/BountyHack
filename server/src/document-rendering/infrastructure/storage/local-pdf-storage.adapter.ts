import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import {
  IPdfStorage,
  SavePdfResult,
} from '../../application/ports/pdf-storage.port';

@Injectable()
export class LocalPdfStorageAdapter implements IPdfStorage {
  private readonly outputDir = path.resolve(process.cwd(), 'pdfs');

  async savePdf(pdfBuffer: Buffer, templateName: string): Promise<SavePdfResult> {
    await mkdir(this.outputDir, { recursive: true });
    const safeTemplateName =
      (templateName || '').replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
    const fileName = `report-${safeTemplateName}-${Date.now()}.pdf`;
    const pdfFilePath = path.resolve(this.outputDir, fileName);
    await writeFile(pdfFilePath, pdfBuffer);

    return {
      fileName,
      /** Path reference only — not exposed via express.static until auth download exists. */
      publicUrl: `/pdfs/${fileName}`,
    };
  }
}
