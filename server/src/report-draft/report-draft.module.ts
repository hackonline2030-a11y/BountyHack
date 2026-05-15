import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReportDraftController } from './controllers/report-draft.controller';
import { I_REPORT_DRAFT_REPOSITORY } from './ports/report-draft-repository.interface';
import { PrismaReportDraftRepository } from './adapters/postgre-prisma/prisma-report-draft.repository';
import { SaveReportDraftCommand } from './application/commands/save-report-draft.command';
import { GetReportDraftByIdQuery } from './application/queries/get-report-draft-by-id.query';
import { ListReportDraftsByHunterQuery } from './application/queries/list-report-drafts-by-hunter.query';

@Module({
  imports: [AuthModule],
  controllers: [ReportDraftController],
  providers: [
    {
      provide: I_REPORT_DRAFT_REPOSITORY,
      useClass: PrismaReportDraftRepository,
    },
    {
      provide: SaveReportDraftCommand,
      inject: [I_REPORT_DRAFT_REPOSITORY],
      useFactory: (repository: PrismaReportDraftRepository) =>
        new SaveReportDraftCommand(repository),
    },
    {
      provide: GetReportDraftByIdQuery,
      inject: [I_REPORT_DRAFT_REPOSITORY],
      useFactory: (repository: PrismaReportDraftRepository) =>
        new GetReportDraftByIdQuery(repository),
    },
    {
      provide: ListReportDraftsByHunterQuery,
      inject: [I_REPORT_DRAFT_REPOSITORY],
      useFactory: (repository: PrismaReportDraftRepository) =>
        new ListReportDraftsByHunterQuery(repository),
    },
  ],
})
export class ReportDraftModule {}
