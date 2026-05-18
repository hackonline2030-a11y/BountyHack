import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../core/infrastructure/database/prisma/prisma.module';
import { PdfController } from './controllers/pdf.controller';
import { PdfJobsController } from './controllers/pdf-jobs.controller';
import { I_TEMPLATE_RENDERER } from './application/ports/template-renderer.port';
import { I_PDF_GENERATOR } from './application/ports/pdf-generator.port';
import { I_PDF_STORAGE } from './application/ports/pdf-storage.port';
import { PrismaReportRepository } from './infrastructure/repositories/prisma-report.repository';
import { EjsTemplateRendererAdapter } from './infrastructure/template/ejs-template-renderer.adapter';
import { PuppeteerPdfGeneratorAdapter } from './infrastructure/pdf/puppeteer-pdf-generator.adapter';
import { LocalPdfStorageAdapter } from './infrastructure/storage/local-pdf-storage.adapter';
import { ITemplateRenderer } from './application/ports/template-renderer.port';
import { IPdfGenerator } from './application/ports/pdf-generator.port';
import { IPdfStorage } from './application/ports/pdf-storage.port';
import {
  I_REPORT_REPOSITORY,
  IReportRepository,
} from './application/ports/report-repository.port';
import { PreviewReportHtmlQuery } from './application/queries/preview-report-html.query';
import { GenerateReportPdfCommand } from './application/commands/generate-report-pdf.command';
import { ReportPdfProcessor } from './infrastructure/queue/report-pdf.processor';
import { PDF_GENERATION_QUEUE } from './infrastructure/queue/pdf-generation.constants';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
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
  exports: [I_REPORT_REPOSITORY],
  providers: [
    ReportPdfProcessor,
    {
      provide: I_REPORT_REPOSITORY,
      useClass: PrismaReportRepository,
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
      provide: PreviewReportHtmlQuery,
      inject: [I_REPORT_REPOSITORY, I_TEMPLATE_RENDERER],
      useFactory: (
        reportRepository: IReportRepository,
        templateRenderer: ITemplateRenderer,
      ) =>
        new PreviewReportHtmlQuery(reportRepository, templateRenderer),
    },
    {
      provide: GenerateReportPdfCommand,
      inject: [I_REPORT_REPOSITORY, I_TEMPLATE_RENDERER, I_PDF_GENERATOR, I_PDF_STORAGE],
      useFactory: (
        reportRepository: IReportRepository,
        templateRenderer: ITemplateRenderer,
        pdfGenerator: IPdfGenerator,
        pdfStorage: IPdfStorage,
      ) =>
        new GenerateReportPdfCommand(
          reportRepository,
          templateRenderer,
          pdfGenerator,
          pdfStorage,
        ),
    },
  ],
})
export class DocumentRenderingModule {}
