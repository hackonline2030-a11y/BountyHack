import { Module } from '@nestjs/common';
import { PdfController } from './controllers/pdf.controller';
import { PreviewCvHtmlQuery } from './application/queries/preview-cv-html.query';
import { GenerateCvPdfCommand } from './application/commands/generate-cv-pdf.command';
import { I_CV_REPOSITORY } from './application/ports/cv-repository.port';
import { I_TEMPLATE_RENDERER } from './application/ports/template-renderer.port';
import { I_PDF_GENERATOR } from './application/ports/pdf-generator.port';
import { I_PDF_STORAGE } from './application/ports/pdf-storage.port';
import { JsonCvRepositoryAdapter } from './infrastructure/repositories/json-cv.repository';
import { EjsTemplateRendererAdapter } from './infrastructure/template/ejs-template-renderer.adapter';
import { PuppeteerPdfGeneratorAdapter } from './infrastructure/pdf/puppeteer-pdf-generator.adapter';
import { LocalPdfStorageAdapter } from './infrastructure/storage/local-pdf-storage.adapter';
import { ICvRepository } from './application/ports/cv-repository.port';
import { ITemplateRenderer } from './application/ports/template-renderer.port';
import { IPdfGenerator } from './application/ports/pdf-generator.port';
import { IPdfStorage } from './application/ports/pdf-storage.port';

@Module({
  controllers: [PdfController],
  exports: [I_CV_REPOSITORY],
  providers: [
    {
      provide: I_CV_REPOSITORY,
      useClass: JsonCvRepositoryAdapter,
    },
    {
      provide: I_TEMPLATE_RENDERER,
      useClass: EjsTemplateRendererAdapter,
    },
    {
      provide: I_PDF_GENERATOR,
      useClass: PuppeteerPdfGeneratorAdapter,
    },
    {
      provide: I_PDF_STORAGE,
      useClass: LocalPdfStorageAdapter,
    },
    {
      provide: PreviewCvHtmlQuery,
      inject: [I_CV_REPOSITORY, I_TEMPLATE_RENDERER],
      useFactory: (
        cvRepository: ICvRepository,
        templateRenderer: ITemplateRenderer,
      ) =>
        new PreviewCvHtmlQuery(cvRepository, templateRenderer),
    },
    {
      provide: GenerateCvPdfCommand,
      inject: [I_CV_REPOSITORY, I_TEMPLATE_RENDERER, I_PDF_GENERATOR, I_PDF_STORAGE],
      useFactory: (
        cvRepository: ICvRepository,
        templateRenderer: ITemplateRenderer,
        pdfGenerator: IPdfGenerator,
        pdfStorage: IPdfStorage,
      ) =>
        new GenerateCvPdfCommand(
          cvRepository,
          templateRenderer,
          pdfGenerator,
          pdfStorage,
        ),
    },
  ]
})
export class DocumentRenderingModule {}
