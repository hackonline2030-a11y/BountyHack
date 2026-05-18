import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../core/infrastructure/database/prisma/prisma.module';
import { ReportDraftModule } from '../report-draft/report-draft.module';
import { PdfController } from './controllers/pdf.controller';
import { PdfJobsController } from './controllers/pdf-jobs.controller';
import { I_TEMPLATE_RENDERER } from './application/ports/template-renderer.port';
import { I_PDF_GENERATOR } from './application/ports/pdf-generator.port';
import { PrismaReportDraftDocumentRepository } from './infrastructure/repositories/prisma-report-draft-document.repository';
import { EjsTemplateRendererAdapter } from './infrastructure/template/ejs-template-renderer.adapter';
import { PuppeteerPdfGeneratorAdapter } from './infrastructure/pdf/puppeteer-pdf-generator.adapter';
import { ITemplateRenderer } from './application/ports/template-renderer.port';
import { IPdfGenerator } from './application/ports/pdf-generator.port';
import {
  I_REPORT_DRAFT_DOCUMENT_REPOSITORY,
  IReportDraftDocumentRepository,
} from './application/ports/report-draft-document-repository.port';
import { I_REPORT_DRAFT_REPOSITORY } from '../report-draft/ports/report-draft-repository.interface';
import type { IReportDraftRepository } from '../report-draft/ports/report-draft-repository.interface';
import { PreviewReportHtmlQuery } from './application/queries/preview-report-html.query';
import { GenerateReportPdfCommand } from './application/commands/generate-report-pdf.command';
import { ReportPdfProcessor } from './infrastructure/queue/report-pdf.processor';
import { PDF_GENERATION_QUEUE } from './infrastructure/queue/pdf-generation.constants';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ReportDraftModule,
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const portRaw = config.get<string>('REDIS_PORT', '6379');
        const port = Number.parseInt(portRaw, 10);
        const password = config.get<string>('REDIS_PASSWORD');
        return {
          connection: {
            host: config.get<string>('REDIS_HOST', '127.0.0.1'),
            port: Number.isFinite(port) ? port : 6379,
            ...(password && password.trim() !== ''
              ? { password: password.trim() }
              : {}),
          },
          defaultJobOptions: {
            removeOnComplete: 500,
            removeOnFail: 2000,
            attempts: 3,
            backoff: { type: 'exponential' as const, delay: 2000 },
          },
        };
      },
    }),
    BullModule.registerQueue({ name: PDF_GENERATION_QUEUE }),
  ],
  controllers: [PdfController, PdfJobsController],
  exports: [I_REPORT_DRAFT_DOCUMENT_REPOSITORY],
  providers: [
    ReportPdfProcessor,
    {
      provide: I_REPORT_DRAFT_DOCUMENT_REPOSITORY,
      inject: [I_REPORT_DRAFT_REPOSITORY],
      useFactory: (reportDraftRepository: IReportDraftRepository) =>
        new PrismaReportDraftDocumentRepository(reportDraftRepository),
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
      provide: PreviewReportHtmlQuery,
      inject: [I_REPORT_DRAFT_DOCUMENT_REPOSITORY, I_TEMPLATE_RENDERER],
      useFactory: (
        documentRepository: IReportDraftDocumentRepository,
        templateRenderer: ITemplateRenderer,
      ) => new PreviewReportHtmlQuery(documentRepository, templateRenderer),
    },
    {
      provide: GenerateReportPdfCommand,
      inject: [
        I_REPORT_DRAFT_DOCUMENT_REPOSITORY,
        I_TEMPLATE_RENDERER,
        I_PDF_GENERATOR,
      ],
      useFactory: (
        documentRepository: IReportDraftDocumentRepository,
        templateRenderer: ITemplateRenderer,
        pdfGenerator: IPdfGenerator,
      ) =>
        new GenerateReportPdfCommand(
          documentRepository,
          templateRenderer,
          pdfGenerator,
        ),
    },
  ],
})
export class DocumentRenderingModule {}
