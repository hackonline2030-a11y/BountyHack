import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../core/infrastructure/database/prisma/prisma.module';
import { ReportDraftModule } from '../report-draft/report-draft.module';
import { ManageQualityCategoriesCommand } from './application/commands/manage-quality-categories.command';
import { ManageQualityCriteriaCommand } from './application/commands/manage-quality-criteria.command';
import { ManageQualityDistributionsCommand } from './application/commands/manage-quality-distributions.command';
import { ManageQualityTargetTypesCommand } from './application/commands/manage-quality-target-types.command';
import { UpsertQualityCheckCommand } from './application/commands/upsert-quality-check.command';
import { ListQualityCriterionReportTargetsQuery } from './application/queries/list-quality-criterion-report-targets.query';
import { ListQualityReportDistributionCountsQuery } from './application/queries/list-quality-report-distribution-counts.query';
import { ListQualityReportDraftTargetsQuery } from './application/queries/list-quality-report-draft-targets.query';
import { QualityAccessPolicy } from './application/quality-access.policy';
import { PathCourseQualityTargetHandler } from './application/target-handlers/path-course-target.handler';
import { QualityTargetHandlerRegistry } from './application/target-handlers/quality-target-handler.registry';
import { ReportQualityTargetHandler } from './application/target-handlers/report-target.handler';
import { PrismaQualityRepository } from './adapters/postgre-prisma/prisma-quality.repository';
import { QualityCategoriesController } from './controllers/quality-categories.controller';
import { QualityCriteriaController } from './controllers/quality-criteria.controller';
import { QualityInstancesController } from './controllers/quality-instances.controller';
import { QualityReportTargetsController } from './controllers/quality-report-targets.controller';
import { QualityTargetTypesController } from './controllers/quality-target-types.controller';
import { I_QUALITY_REPOSITORY } from './ports/quality-repository.interface';

@Module({
  imports: [AuthModule, PrismaModule, ReportDraftModule],
  controllers: [
    QualityCategoriesController,
    QualityTargetTypesController,
    QualityCriteriaController,
    QualityInstancesController,
    QualityReportTargetsController,
  ],
  providers: [
    ListQualityReportDraftTargetsQuery,
    ListQualityCriterionReportTargetsQuery,
    ListQualityReportDistributionCountsQuery,
    QualityAccessPolicy,
    ReportQualityTargetHandler,
    PathCourseQualityTargetHandler,
    QualityTargetHandlerRegistry,
    {
      provide: I_QUALITY_REPOSITORY,
      useClass: PrismaQualityRepository,
    },
    {
      provide: ManageQualityCategoriesCommand,
      inject: [I_QUALITY_REPOSITORY, QualityAccessPolicy],
      useFactory: (repository: PrismaQualityRepository, access: QualityAccessPolicy) =>
        new ManageQualityCategoriesCommand(repository, access),
    },
    {
      provide: ManageQualityTargetTypesCommand,
      inject: [I_QUALITY_REPOSITORY, QualityAccessPolicy],
      useFactory: (repository: PrismaQualityRepository, access: QualityAccessPolicy) =>
        new ManageQualityTargetTypesCommand(repository, access),
    },
    {
      provide: ManageQualityCriteriaCommand,
      inject: [I_QUALITY_REPOSITORY, QualityAccessPolicy],
      useFactory: (repository: PrismaQualityRepository, access: QualityAccessPolicy) =>
        new ManageQualityCriteriaCommand(repository, access),
    },
    {
      provide: ManageQualityDistributionsCommand,
      inject: [
        I_QUALITY_REPOSITORY,
        QualityAccessPolicy,
        QualityTargetHandlerRegistry,
      ],
      useFactory: (
        repository: PrismaQualityRepository,
        access: QualityAccessPolicy,
        targetHandlers: QualityTargetHandlerRegistry,
      ) =>
        new ManageQualityDistributionsCommand(repository, access, targetHandlers),
    },
    {
      provide: UpsertQualityCheckCommand,
      inject: [
        I_QUALITY_REPOSITORY,
        QualityAccessPolicy,
        QualityTargetHandlerRegistry,
      ],
      useFactory: (
        repository: PrismaQualityRepository,
        access: QualityAccessPolicy,
        targetHandlers: QualityTargetHandlerRegistry,
      ) => new UpsertQualityCheckCommand(repository, access, targetHandlers),
    },
  ],
  exports: [I_QUALITY_REPOSITORY, QualityAccessPolicy],
})
export class QualityModule {}
