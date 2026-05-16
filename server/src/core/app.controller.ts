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
  ReportDataMissingError,
  ReportLocaleInvalidError,
  ReportLocaleNotFoundError,
  ReportVersionInvalidError,
  ReportVersionNotFoundError,
} from '../document-rendering/application/errors/pdf-application.errors';

const REPORT_VERSION_ROUTE = /^v\d+$/i;
const REPORT_STYLE_ROUTE = /^[a-z0-9_-]+$/i;
const LOCALE_ROUTE_CODE = /^[a-z]{2}$/;
const LANG_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'English',
};

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
      totpSetupUrl: `${apiPrefix}/dashboard/totp`,
      totpSetupBtnText: 'Demo : activer le TOTP',
    };
  }

  @Get('/dashboard/totp')
  @Render('totp-dashboard')
  @ApiOperation({
    summary: 'Demo dashboard — enable TOTP (JWT)',
    description:
      'Page HTML : login, puis `POST .../auth/totp/enable/start` et `confirm` avec Bearer token.',
  })
  @ApiOkResponse({
    description: 'HTML dashboard for TOTP enrollment.',
    content: {
      'text/html': {
        schema: { type: 'string' },
      },
    },
  })
  getTotpDashboardPage() {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    return {
      apiPrefix,
      issuer: process.env.TOTP_ISSUER?.trim() || 'BugBountyApp',
    };
  }

  @Get('/dashboard')
  @Render('dashboard')
  @ApiOperation({
    summary: 'Choose report dashboard style',
    description:
      'Lists available report styles (folders under `src/document-rendering/data` with `report.json`); each opens `/dashboard/:style`.',
  })
  @ApiOkResponse({
    description: 'HTML dashboard page returned.',
    content: {
      'text/html': {
        schema: {
          type: 'string',
          example:
            '<!doctype html><html><head><title>Dashboard</title></head><body>...</body></html>',
        },
      },
    },
  })
  async getDashboardVersionPickerPage() {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    const texts = this.appService.getDashboardTexts();
    const styles = await this.reportRepository.listReportStyles();
    if (!styles.length) {
      throw new NotFoundException(
        'No report style folders found. Add data under `src/document-rendering/data/<style>/v1/` with `report.json` (and optional `report.<lang>.json`).',
      );
    }

    return {
      ...texts,
      mode: 'pick' as const,
      dashboardBaseUrl: `${apiPrefix}/dashboard`,
      pickerItems: styles.map((style) => ({
        href: `${apiPrefix}/dashboard/${style}`,
        label: `${texts.openVersionPrefix}${style}`,
      })),
      homeUrl: `${apiPrefix}`,
    };
  }

  @Get('/dashboard/:style')
  @Render('dashboard')
  @ApiOperation({
    summary: 'Choose report dashboard version for one style',
    description: 'Lists available versions for one style (`/dashboard/:style/:version`).',
  })
  @ApiOkResponse({
    description: 'HTML dashboard page returned.',
    content: {
      'text/html': {
        schema: {
          type: 'string',
          example:
            '<!doctype html><html><head><title>Dashboard</title></head><body>...</body></html>',
        },
      },
    },
  })
  async getDashboardStylePage(@Param('style') styleParam: string) {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    const texts = this.appService.getDashboardTexts();
    const style = typeof styleParam === 'string' ? styleParam.trim().toLowerCase() : '';

    if (!REPORT_STYLE_ROUTE.test(style)) {
      throw new BadRequestException(
        `Invalid report style '${styleParam}'. Expected a slug like report-final.`,
      );
    }

    const versions = await this.reportRepository.listReportVersions(style);
    if (!versions.length) {
      throw new NotFoundException(
        `No populated version folders found for style '${style}'. Add report.json under src/document-rendering/data/${style}/v1/ (or another v* folder).`,
      );
    }

    return {
      ...texts,
      mode: 'pick' as const,
      dashboardBaseUrl: `${apiPrefix}/dashboard`,
      pickerItems: versions.map((version) => ({
        href: `${apiPrefix}/dashboard/${style}/${version}`,
        label: `${texts.openVersionPrefix}${version}`,
      })),
      currentStyle: style,
      homeUrl: `${apiPrefix}`,
    };
  }

  @Get('/dashboard/:style/:version')
  @Render('dashboard')
  @ApiOperation({
    summary: 'Render report dashboard for one style/version',
    description:
      'Preview and PDF actions use matching `style`, `version`, and `lang` query parameters.',
  })
  @ApiOkResponse({
    description: 'HTML dashboard page returned.',
    content: {
      'text/html': {
        schema: {
          type: 'string',
          example:
            '<!doctype html><html><head><title>Dashboard</title></head><body>...</body></html>',
        },
      },
    },
  })
  async getDashboardVersionPage(
    @Param('style') styleParam: string,
    @Param('version') versionParam: string,
    @Query('lang') lang?: string,
  ) {
    const apiPrefix = `/${variables.globalPrefix.replace(/^\/+|\/+$/g, '')}`;
    const texts = this.appService.getDashboardTexts();
    const style = typeof styleParam === 'string' ? styleParam.trim().toLowerCase() : '';
    const slug = typeof versionParam === 'string' ? versionParam.trim() : '';

    if (!REPORT_STYLE_ROUTE.test(style)) {
      throw new BadRequestException(
        `Invalid report style '${styleParam}'. Expected a slug like report-final.`,
      );
    }

    if (!REPORT_VERSION_ROUTE.test(slug)) {
      throw new BadRequestException(
        `Invalid report version '${slug}'. Expected a slug like v1 or v2.`,
      );
    }

    const version = slug.toLowerCase();

    const locales = await this.reportRepository.listReportLocales(style, version);

    if (!locales.length) {
      throw new NotFoundException(
        `No report locale files found for '${style}/${version}'. Add report.json / report.<lang>.json under that folder.`,
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

    if (trimmed !== '' && !locales.includes(trimmed)) {
      throw new NotFoundException(
        `Language '${trimmed}' is not available for version ${version}.`,
      );
    }

    try {
      await this.reportRepository.getReportTemplateData(
        style,
        version,
        trimmed === '' ? undefined : trimmed,
      );
    } catch (e) {
      if (
        e instanceof ReportLocaleInvalidError ||
        e instanceof ReportDataInvalidError ||
        e instanceof ReportVersionInvalidError
      ) {
        throw new BadRequestException(e.message);
      }
      if (
        e instanceof ReportLocaleNotFoundError ||
        e instanceof ReportVersionNotFoundError ||
        e instanceof ReportDataMissingError
      ) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }

    let effectiveLang: string;
    if (trimmed !== '') {
      effectiveLang = trimmed;
    } else {
      const primary = locales[0];
      if (primary === undefined) {
        throw new NotFoundException(
          `No report locale files found for '${style}/${version}'.`,
        );
      }
      effectiveLang = primary;
    }
    const params = new URLSearchParams();
    params.set('style', style);
    params.set('version', version);
    params.set('lang', effectiveLang);

    const query = `?${params.toString()}`;
    const pdfBase = `${apiPrefix}/pdf`;

    return {
      ...texts,
      mode: 'preview' as const,
      dashboardBaseUrl: `${apiPrefix}/dashboard`,
      pickerItems: [] as { href: string; label: string }[],
      currentStyle: style,
      currentVersion: version,
      locales,
      currentLang: effectiveLang,
      localeOptions: locales.map((code) => ({
        code,
        label: LANG_LABELS[code] ?? code.toUpperCase(),
      })),
      previewUrl: `${pdfBase}/previewHtml${query}`,
      generateUrl: `${pdfBase}/htmlToPDF${query}`,
      homeUrl: `${apiPrefix}`,
    };
  }
}
