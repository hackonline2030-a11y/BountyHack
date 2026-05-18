import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  Render,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { variables } from '../shared/variables.config';
import {
  I_REPORT_REPOSITORY,
  IReportRepository,
} from '../document-rendering/application/ports/report-repository.port';
import {
  ReportDataInvalidError,
  ReportIdInvalidError,
  ReportLocaleInvalidError,
  ReportNotFoundError,
} from '../document-rendering/application/errors/pdf-application.errors';

const REPORT_ID_ROUTE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCALE_ROUTE_CODE = /^[a-z]{2}$/;

@ApiTags('root')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(I_REPORT_REPOSITORY)
    private readonly reportRepository: IReportRepository,
  ) {}

  @Get('/')
  @Render('index')
  @ApiOperation({
    summary: 'Render API landing page',
    description: 'Returns the server-rendered home page used as an API entry point.',
  })
  @ApiOkResponse({
    description: 'HTML landing page returned.',
    content: {
      'text/html': {
        schema: {
          type: 'string',
          example: '<!doctype html><html><head><title>NestJs Web Api</title></head><body>...</body></html>',
        },
      },
    },
  })
  getHomePage() {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    return {
      title: this.appService.getWelcomTexts().title,
      description: this.appService.getWelcomTexts().description,
      docsBtnText: this.appService.getHomeActions().docs,
      dashboardBtnText: this.appService.getHomeActions().dashboard,
      docsUrl: `${apiPrefix}/docs`,
      dashboardUrl: `${apiPrefix}/dashboard`,
    };
  }

  @Get('/dashboard')
  @Render('dashboard')
  @ApiOperation({
    summary: 'Choose a promoted report for PDF preview',
    description: 'Lists rows from `reports` with frozen_content.',
  })
  async getDashboardReportPickerPage() {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    const texts = this.appService.getDashboardTexts();
    const reports = await this.reportRepository.listReports();

    if (!reports.length) {
      throw new NotFoundException(
        'No promoted reports with frozen_content found in the database.',
      );
    }

    return {
      ...texts,
      mode: 'pick' as const,
      dashboardBaseUrl: `${apiPrefix}/dashboard`,
      pickerItems: reports.map((report) => ({
        href: `${apiPrefix}/dashboard/${report.id}`,
        label: `${report.title} (${report.status})`,
      })),
      homeUrl: `${apiPrefix}`,
    };
  }

  @Get('/dashboard/:reportId')
  @Render('dashboard')
  @ApiOperation({
    summary: 'Render report dashboard for one promoted report',
    description: 'Preview and PDF actions use `reportId` and optional `lang`.',
  })
  async getDashboardReportPage(
    @Param('reportId') reportIdParam: string,
    @Query('lang') lang?: string,
  ) {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    const texts = this.appService.getDashboardTexts();
    const reportId =
      typeof reportIdParam === 'string' ? reportIdParam.trim() : '';

    if (!REPORT_ID_ROUTE.test(reportId)) {
      throw new BadRequestException(
        `Invalid report id '${reportIdParam}'. Expected a UUID.`,
      );
    }

    const trimmed =
      typeof lang === 'string' && lang.trim() !== ''
        ? lang.trim().toLowerCase()
        : '';

    if (trimmed !== '' && !LOCALE_ROUTE_CODE.test(trimmed)) {
      throw new BadRequestException(
        `Invalid language '${lang}'. Expected a code like fr or en.`,
      );
    }

    const effectiveLang = trimmed !== '' ? trimmed : 'fr';

    try {
      await this.reportRepository.getReportTemplateData(
        reportId,
        effectiveLang,
      );
    } catch (e) {
      this.mapRepositoryErrors(e);
    }

    const params = new URLSearchParams();
    params.set('reportId', reportId);
    params.set('lang', effectiveLang);
    const query = `?${params.toString()}`;
    const pdfBase = `${apiPrefix}/pdf`;

    return {
      ...texts,
      mode: 'preview' as const,
      dashboardBaseUrl: `${apiPrefix}/dashboard`,
      pickerItems: [] as { href: string; label: string }[],
      currentReportId: reportId,
      currentLang: effectiveLang,
      localeOptions: [
        { code: 'fr', label: 'Français' },
        { code: 'en', label: 'English' },
      ],
      previewUrl: `${pdfBase}/previewHtml${query}`,
      generateUrl: `${pdfBase}/htmlToPDF${query}`,
      homeUrl: `${apiPrefix}`,
    };
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
