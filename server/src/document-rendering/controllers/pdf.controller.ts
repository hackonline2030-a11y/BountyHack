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
import { PreviewReportHtmlQuery } from '../application/queries/preview-report-html.query';
import { GenerateReportPdfCommand } from '../application/commands/generate-report-pdf.command';
import {
  ReportDataInvalidError,
  ReportIdInvalidError,
  ReportLocaleInvalidError,
  ReportNotFoundError,
} from '../application/errors/pdf-application.errors';

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly previewReportHtmlQuery: PreviewReportHtmlQuery,
    private readonly generateReportPdfCommand: GenerateReportPdfCommand,
  ) {}

  @ApiOperation({
    summary: 'Render report template as HTML preview',
    description:
      'Loads `reports.frozen_content` from the database and renders `templates/report-final/index.ejs`.',
  })
  @ApiQuery({
    name: 'reportId',
    required: true,
    description: 'Promoted report UUID (`reports.id`).',
    example: 'bbbbbbbb-0002-4000-8000-000000000001',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Two-letter locale for labels (default `fr`).',
    example: 'fr',
  })
  @ApiProduces('text/html')
  @ApiOkResponse({
    description: 'Report HTML preview generated.',
    schema: { type: 'string', example: '<!doctype html><html>...</html>' },
  })
  @Get('/previewHtml')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async previewReportHtml(
    @Query('reportId') reportId?: string,
    @Query('lang') lang?: string,
  ) {
    const id = reportId?.trim();
    if (!id) {
      throw new BadRequestException('Query parameter reportId is required.');
    }
    try {
      return await this.previewReportHtmlQuery.execute({
        reportId: id,
        ...(lang !== undefined ? { locale: lang } : {}),
      });
    } catch (e) {
      this.mapRepositoryErrors(e);
    }
  }

  @ApiOperation({
    summary: 'Generate report PDF file',
    description:
      'Generates a PDF from `reports.frozen_content` and returns a storage path reference (`/pdfs/...`).',
  })
  @ApiQuery({
    name: 'reportId',
    required: true,
    description: 'Promoted report UUID (`reports.id`).',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Two-letter locale (default `fr`).',
    example: 'fr',
  })
  @ApiOkResponse({
    description:
      'Report PDF storage path returned (not publicly downloadable yet).',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: '/pdfs/report-final-bbbbbbbb-1714291500000.pdf',
        },
      },
      required: ['url'],
    },
  })
  @Get('/htmlToPDF')
  async exportReportPDF(
    @Query('reportId') reportId?: string,
    @Query('lang') lang?: string,
  ) {
    const id = reportId?.trim();
    if (!id) {
      throw new BadRequestException('Query parameter reportId is required.');
    }
    try {
      return await this.generateReportPdfCommand.execute({
        reportId: id,
        ...(lang !== undefined ? { locale: lang } : {}),
      });
    } catch (e) {
      this.mapRepositoryErrors(e);
    }
  }

  private mapRepositoryErrors(err: unknown): never {
    if (
      err instanceof ReportIdInvalidError ||
      err instanceof ReportLocaleInvalidError ||
      err instanceof ReportDataInvalidError
    ) {
      throw new BadRequestException(err.message);
    }
    if (err instanceof ReportNotFoundError) {
      throw new NotFoundException(err.message);
    }
    throw err;
  }
}
