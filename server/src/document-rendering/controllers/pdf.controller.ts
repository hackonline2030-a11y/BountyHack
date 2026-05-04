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
import {
  CvDataInvalidError,
  CvDataMissingError,
  CvLocaleInvalidError,
  CvLocaleNotFoundError,
  CvVersionInvalidError,
  CvVersionNotFoundError,
} from '../application/errors/pdf-application.errors';

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly previewCvHtmlQuery: PreviewCvHtmlQuery,
    private readonly generateCvPdfCommand: GenerateCvPdfCommand,
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
      this.mapCvRepositoryErrors(e);
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
          example:
            'http://localhost:3000/pdfs/report-1714291500000.pdf',
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
      this.mapCvRepositoryErrors(e);
    }
  }

  private mapCvRepositoryErrors(err: unknown): never {
    if (
      err instanceof CvVersionInvalidError ||
      err instanceof CvLocaleInvalidError ||
      err instanceof CvDataInvalidError
    ) {
      throw new BadRequestException(err.message);
    }
    if (err instanceof CvVersionNotFoundError) {
      throw new NotFoundException(err.message);
    }
    if (err instanceof CvDataMissingError) {
      throw new NotFoundException(err.message);
    }
    if (err instanceof CvLocaleNotFoundError) {
      throw new NotFoundException(err.message);
    }
    throw err;
  }
}