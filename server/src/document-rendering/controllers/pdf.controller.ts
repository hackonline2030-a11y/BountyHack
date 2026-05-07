import {
  BadRequestException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PreviewCvHtmlQuery } from '../application/queries/preview-cv-html.query';
import { GenerateCvPdfCommand } from '../application/commands/generate-cv-pdf.command';
import { PreviewReportHtmlQuery } from '../application/queries/preview-report-html.query';
import { GenerateReportPdfCommand } from '../application/commands/generate-report-pdf.command';
import {
  CvDataInvalidError,
  CvDataMissingError,
  CvLocaleInvalidError,
  CvLocaleNotFoundError,
  CvVersionInvalidError,
  CvVersionNotFoundError,
  ReportDataInvalidError,
  ReportDataMissingError,
  ReportLocaleInvalidError,
  ReportLocaleNotFoundError,
  ReportVersionInvalidError,
  ReportVersionNotFoundError,
} from '../application/errors/pdf-application.errors';

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly previewCvHtmlQuery: PreviewCvHtmlQuery,
    private readonly generateCvPdfCommand: GenerateCvPdfCommand,
    private readonly previewReportHtmlQuery: PreviewReportHtmlQuery,
    private readonly generateReportPdfCommand: GenerateReportPdfCommand,
  ) {}

  @ApiOperation({
    summary: 'Render CV template as HTML preview',
    description:
      'Renders the EJS CV template for the requested CV content version (`v1`, `v2`, … under `src/document-rendering/data`) and returns raw HTML.',
  })
  @ApiQuery({
    name: 'style',
    required: false,
    description:
      'CV data style folder (`red-curb`, `red-squared`, `hetic-squared`, …) under `src/document-rendering/data`. When omitted, the first available style is used.',
    example: 'red-curb',
  })
  @ApiQuery({
    name: 'version',
    required: false,
    description:
      'CV content folder slug (`v1`, `v2`, …). When omitted, the first available folder is used.',
    example: 'v1',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description:
      'Locale file to load (`fr` maps to `cv.json`, `en` to `cv.en.json`, …). When omitted, the default for that folder is used (French first when present).',
    example: 'en',
  })
  @ApiProduces('text/html')
  @ApiOkResponse({
    description: 'HTML preview generated.',
    schema: { type: 'string', example: '<!doctype html><html>...</html>' },
  })
  @Get('/previewHtml')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async previewHtml(
    @Query('style') style?: string,
    @Query('version') version?: string,
    @Query('lang') lang?: string,
  ) {
    try {
      return await this.previewCvHtmlQuery.execute({
        ...(style !== undefined ? { style } : {}),
        ...(version !== undefined ? { version } : {}),
        ...(lang !== undefined ? { locale: lang } : {}),
      });
    } catch (e) {
      this.mapRepositoryErrors(e);
    }
  }

  @ApiOperation({
    summary: 'Generate CV PDF file',
    description:
      'Generates a PDF from the CV template for the given content version and returns a public URL to the generated file.',
  })
  @ApiQuery({
    name: 'style',
    required: false,
    description:
      'CV data style folder (`red-curb`, `red-squared`, `hetic-squared`, …) under `src/document-rendering/data`. When omitted, the first available style is used.',
    example: 'red-curb',
  })
  @ApiQuery({
    name: 'version',
    required: false,
    description:
      'CV content folder slug (`v1`, `v2`, …). When omitted, the first available folder is used.',
    example: 'v1',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description:
      'Locale file to load (`fr` ↔ `cv.json`, `en` ↔ `cv.en.json`, …). Omits defaults to folder default.',
    example: 'en',
  })
  @ApiOkResponse({
    description: 'PDF URL returned.',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: '/pdfs/report-1714291500000.pdf',
        },
      },
      required: ['url'],
    },
  })
  @Get('/htmlToPDF')
  async exportPDF(
    @Query('style') style?: string,
    @Query('version') version?: string,
    @Query('lang') lang?: string,
  ) {
    try {
      return await this.generateCvPdfCommand.execute({
        ...(style !== undefined ? { style } : {}),
        ...(version !== undefined ? { version } : {}),
        ...(lang !== undefined ? { locale: lang } : {}),
      });
    } catch (e) {
      this.mapRepositoryErrors(e);
    }
  }

  @ApiOperation({
    summary: 'Render report template as HTML preview',
    description:
      'Renders the EJS report template for the requested report content version (`v1`, `v2`, … under `src/document-rendering/data`) and returns raw HTML.',
  })
  @ApiQuery({
    name: 'style',
    required: false,
    description: 'Report data style folder (e.g. `report-final`).',
    example: 'report-final',
  })
  @ApiQuery({
    name: 'version',
    required: false,
    description: 'Report content folder slug (`v1`, `v2`, …).',
    example: 'v1',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Locale file to load (`fr` maps to `report.json`, `en` to `report.en.json`, …).',
    example: 'fr',
  })
  @ApiProduces('text/html')
  @ApiOkResponse({
    description: 'Report HTML preview generated.',
    schema: { type: 'string', example: '<!doctype html><html>...</html>' },
  })
  @Get('/report/previewHtml')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async previewReportHtml(
    @Query('style') style?: string,
    @Query('version') version?: string,
    @Query('lang') lang?: string,
  ) {
    try {
      return await this.previewReportHtmlQuery.execute({
        ...(style !== undefined ? { style } : {}),
        ...(version !== undefined ? { version } : {}),
        ...(lang !== undefined ? { locale: lang } : {}),
      });
    } catch (e) {
      this.mapRepositoryErrors(e);
    }
  }

  @ApiOperation({
    summary: 'Generate report PDF file',
    description:
      'Generates a PDF from the report template for the given content version and returns a public URL.',
  })
  @ApiQuery({
    name: 'style',
    required: false,
    description: 'Report data style folder (e.g. `report-final`).',
    example: 'report-final',
  })
  @ApiQuery({
    name: 'version',
    required: false,
    description: 'Report content folder slug (`v1`, `v2`, …).',
    example: 'v1',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Locale file to load (`fr` ↔ `report.json`, `en` ↔ `report.en.json`, …).',
    example: 'fr',
  })
  @ApiOkResponse({
    description: 'Report PDF URL returned.',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: '/pdfs/report-final-1714291500000.pdf',
        },
      },
      required: ['url'],
    },
  })
  @Get('/report/htmlToPDF')
  async exportReportPDF(
    @Query('style') style?: string,
    @Query('version') version?: string,
    @Query('lang') lang?: string,
  ) {
    try {
      return await this.generateReportPdfCommand.execute({
        ...(style !== undefined ? { style } : {}),
        ...(version !== undefined ? { version } : {}),
        ...(lang !== undefined ? { locale: lang } : {}),
      });
    } catch (e) {
      this.mapRepositoryErrors(e);
    }
  }

  private mapRepositoryErrors(err: unknown): never {
    if (
      err instanceof CvVersionInvalidError ||
      err instanceof CvLocaleInvalidError ||
      err instanceof CvDataInvalidError ||
      err instanceof ReportVersionInvalidError ||
      err instanceof ReportLocaleInvalidError ||
      err instanceof ReportDataInvalidError
    ) {
      throw new BadRequestException(err.message);
    }
    if (err instanceof CvVersionNotFoundError || err instanceof ReportVersionNotFoundError) {
      throw new NotFoundException(err.message);
    }
    if (err instanceof CvDataMissingError || err instanceof ReportDataMissingError) {
      throw new NotFoundException(err.message);
    }
    if (err instanceof CvLocaleNotFoundError || err instanceof ReportLocaleNotFoundError) {
      throw new NotFoundException(err.message);
    }
    throw err;
  }
}