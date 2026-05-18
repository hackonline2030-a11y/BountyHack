import {
  BadRequestException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { AuthRoles } from '../../auth/rbac/roles.decorator';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
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
@AuthRoles(AppRoleCode.SUPER_ADMIN)
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly previewReportHtmlQuery: PreviewReportHtmlQuery,
    private readonly generateReportPdfCommand: GenerateReportPdfCommand,
  ) {}

  @ApiOperation({
    summary: 'Render report template as HTML preview',
    description:
      'Loads a published `report_draft` and renders `templates/report-final/index.ejs`.',
  })
  @ApiQuery({
    name: 'draftId',
    required: true,
    description: 'Published report draft UUID (`report_drafts.id`).',
    example: 'bbbbbbbb-0001-4000-8000-000000000001',
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
    @Query('draftId') draftId?: string,
    @Query('lang') lang?: string,
  ) {
    const id = draftId?.trim();
    if (!id) {
      throw new BadRequestException('Query parameter draftId is required.');
    }
    try {
      return await this.previewReportHtmlQuery.execute({
        draftId: id,
        ...(lang !== undefined ? { locale: lang } : {}),
      });
    } catch (e) {
      this.mapRepositoryErrors(e);
    }
  }

  @ApiOperation({
    summary: 'Generate and download report PDF (super-admin)',
    description:
      'Renders a published report draft with Puppeteer and streams the PDF from memory (no disk storage).',
  })
  @ApiQuery({
    name: 'draftId',
    required: true,
    description: 'Published report draft UUID (`report_drafts.id`).',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Two-letter locale (default `fr`).',
    example: 'fr',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Report PDF file stream.',
    schema: { type: 'string', format: 'binary' },
  })
  @Get('/export')
  @Header('Content-Type', 'application/pdf')
  async exportReportPdfDownload(
    @Query('draftId') draftId?: string,
    @Query('lang') lang?: string,
  ): Promise<StreamableFile> {
    const id = draftId?.trim();
    if (!id) {
      throw new BadRequestException('Query parameter draftId is required.');
    }
    let result: { buffer: Buffer; fileName: string };
    try {
      result = await this.generateReportPdfCommand.execute({
        draftId: id,
        ...(lang !== undefined ? { locale: lang } : {}),
      });
    } catch (e) {
      this.mapRepositoryErrors(e);
    }

    return new StreamableFile(result.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${result.fileName}"`,
    });
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
