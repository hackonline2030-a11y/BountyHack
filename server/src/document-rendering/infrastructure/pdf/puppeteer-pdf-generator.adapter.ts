import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { IPdfGenerator } from '../../application/ports/pdf-generator.port';
import { PdfGenerationFailedError } from '../../application/errors/pdf-application.errors';

const A4_WIDTH_MM = '210mm';
const A4_HEIGHT_MM = '297mm';

/** Docker / CI: system Chromium (see CHROMIUM_PATH in Dockerfile — same idea as https://medium.com/@george.benjamin.lopez/running-puppeteer-in-docker-a-simple-guide-to-headless-browsing-25f83d4b492a ). */
function resolveChromiumExecutablePath(): string | undefined {
  const p =
    process.env.CHROMIUM_PATH?.trim() ||
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  return p ? p : undefined;
}

/** Last-resort overrides so Headless Chromium PDF matches one A4 canvas (fixes blank tail / bleed vs template @media print). */
function injectBaseHref(htmlContent: string, origin: string): string {
  const href = origin.endsWith('/') ? origin : `${origin}/`;
  if (/<head[^>]*>/i.test(htmlContent)) {
    return htmlContent.replace(/<head[^>]*>/i, (m) => `${m}<base href="${href}">`);
  }
  return `<!DOCTYPE html><html><head><base href="${href}"><meta charset="utf-8"></head><body>${htmlContent}</body></html>`;
}

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
    const executablePath = resolveChromiumExecutablePath();
    const browser = await puppeteer.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
      ],
    });

    try {
      const page = await browser.newPage();
      const port = process.env.PORT ?? '3000';
      const origin = `http://127.0.0.1:${port}`;
      await page.setContent(injectBaseHref(htmlContent, origin), {
        waitUntil: 'networkidle0',
      });
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
