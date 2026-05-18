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
  I_REPORT_DRAFT_DOCUMENT_REPOSITORY,
  IReportDraftDocumentRepository,
} from '../document-rendering/application/ports/report-draft-document-repository.port';
import {
  ReportDataInvalidError,
  ReportIdInvalidError,
  ReportLocaleInvalidError,
  ReportNotFoundError,
} from '../document-rendering/application/errors/pdf-application.errors';

const DRAFT_ID_ROUTE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCALE_ROUTE_CODE = /^[a-z]{2}$/;

@ApiTags('root')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(I_REPORT_DRAFT_DOCUMENT_REPOSITORY)
    private readonly documentRepository: IReportDraftDocumentRepository,
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
    summary: 'Choose a published report draft for PDF preview',
    description: 'Lists `report_drafts` with aggregate status published.',
  })
  async getDashboardReportPickerPage() {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    const texts = this.appService.getDashboardTexts();
    const drafts = await this.documentRepository.listPublishedDrafts();

    if (!drafts.length) {
      throw new NotFoundException(
        'No published report drafts found in the database.',
      );
    }

    return {
      ...texts,
      mode: 'pick' as const,
      dashboardBaseUrl: `${apiPrefix}/dashboard`,
      pickerItems: drafts.map((draft) => ({
        href: `${apiPrefix}/dashboard/${draft.id}`,
        label: `${draft.title} (${draft.status})`,
      })),
      homeUrl: `${apiPrefix}`,
    };
  }

  @Get('/dashboard/:draftId')
  @Render('dashboard')
  @ApiOperation({
    summary: 'Render report dashboard for one published draft',
    description: 'Preview and PDF actions use `draftId` and optional `lang`.',
  })
  async getDashboardReportPage(
    @Param('draftId') draftIdParam: string,
    @Query('lang') lang?: string,
  ) {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    const texts = this.appService.getDashboardTexts();
    const draftId =
      typeof draftIdParam === 'string' ? draftIdParam.trim() : '';

    if (!DRAFT_ID_ROUTE.test(draftId)) {
      throw new BadRequestException(
        `Invalid draft id '${draftIdParam}'. Expected a UUID.`,
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

    let reportDoc;
    try {
      reportDoc = await this.documentRepository.getDocumentTemplateData(
        draftId,
        effectiveLang,
      );
    } catch (e) {
      this.mapRepositoryErrors(e);
    }

    const data = reportDoc!.toReadModel();
    const params = new URLSearchParams();
    params.set('draftId', draftId);
    params.set('lang', effectiveLang);
    const query = `?${params.toString()}`;
    const pdfBase = `${apiPrefix}/pdf`;

    return {
      ...texts,
      mode: 'preview' as const,
      title: data.title,
      dashboardBaseUrl: `${apiPrefix}/dashboard`,
      pickerItems: [] as { href: string; label: string }[],
      currentReportId: draftId,
      currentLang: effectiveLang,
      localeOptions: [
        { code: 'fr', label: 'Français' },
        { code: 'en', label: 'English' },
      ],
      previewUrl: `${pdfBase}/previewHtml${query}`,
      generateUrl: `${pdfBase}/export${query}`,
      homeUrl: `${apiPrefix}`,
      reportContext: {
        meta: data.meta,
        cvss: data.cvss,
        reportTeam: data.reportTeam,
        reportId: data.reportId,
        reportStatus: data.reportStatus,
        frozenAt: data.frozenAt,
        labels: data.labels,
      },
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
