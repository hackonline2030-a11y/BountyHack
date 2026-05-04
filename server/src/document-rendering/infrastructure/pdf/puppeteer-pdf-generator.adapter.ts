import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { IPdfGenerator } from '../../application/ports/pdf-generator.port';
import { PdfGenerationFailedError } from '../../application/errors/pdf-application.errors';

const A4_WIDTH_MM = '210mm';
const A4_HEIGHT_MM = '297mm';

/** Last-resort overrides so Headless Chromium PDF matches one A4 canvas (fixes blank tail / bleed vs template @media print). */
const PDF_LAYOUT_OVERRIDE_CSS = `
  .cv {
    box-shadow: none !important;
    margin: 0 !important;
    width: auto !important;
    height: ${A4_HEIGHT_MM} !important;
    min-height: ${A4_HEIGHT_MM} !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .cv .layout,
  .cv .left,
  .cv .right {
    min-height: inherit !important;
  }
`;

@Injectable()
export class PuppeteerPdfGeneratorAdapter implements IPdfGenerator {
  private readonly cssPath = path.resolve(
    process.cwd(),
    'static',
    'css',
    'styles.css',
  );

  async generateFromHtml(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinting=none',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('print');

      const cssContent = await readFile(this.cssPath, 'utf-8');
      await page.addStyleTag({ content: cssContent });
      await page.addStyleTag({ content: PDF_LAYOUT_OVERRIDE_CSS });

      const pdfData = await page.pdf({
        width: A4_WIDTH_MM,
        height: A4_HEIGHT_MM,
        preferCSSPageSize: false,
        scale: 1,
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });

      return Buffer.from(pdfData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PdfGenerationFailedError(message);
    } finally {
      await browser.close();
    }
  }
}
