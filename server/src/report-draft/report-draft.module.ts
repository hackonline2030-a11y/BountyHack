import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../users/user.module';
import { I_USER_REPOSITORY } from '../users/ports/user-repository.interface';
import type { IUserRepository } from '../users/ports/user-repository.interface';
import { ReportTeamModule } from '../report-team/report-team.module';
import { I_REPORT_TEAM_REPOSITORY } from '../report-team/ports/report-team-repository.interface';
import type { IReportTeamRepository } from '../report-team/ports/report-team-repository.interface';
import { ReportDraftController } from './controllers/report-draft.controller';
import { ReportDraftAdminController } from './controllers/report-draft-admin.controller';
import { ReportDraftCoordinationController } from './controllers/report-draft-coordination.controller';
import { SubmissionController } from './controllers/submission.controller';
import { GlobalSubmissionController } from './controllers/global-submission.controller';
import { ReviewerCommentController } from './controllers/reviewer-comment.controller';
import { I_REPORT_DRAFT_REPOSITORY } from './ports/report-draft-repository.interface';
import { I_SUBMISSION_REPOSITORY } from './ports/submission-repository.interface';
import { I_REVIEWER_COMMENT_REPOSITORY } from './ports/reviewer-comment-repository.interface';
import { I_GLOBAL_SUBMISSION_REPOSITORY } from './ports/global-submission-repository.interface';
import { I_GLOBAL_REVIEWER_COMMENT_REPOSITORY } from './ports/global-reviewer-comment-repository.interface';
import { PrismaReportDraftRepository } from './adapters/postgre-prisma/prisma-report-draft.repository';
import { PrismaSubmissionRepository } from './adapters/postgre-prisma/prisma-submission.repository';
import { PrismaReviewerCommentRepository } from './adapters/postgre-prisma/prisma-reviewer-comment.repository';
import { PrismaGlobalSubmissionRepository } from './adapters/postgre-prisma/prisma-global-submission.repository';
import { PrismaGlobalReviewerCommentRepository } from './adapters/postgre-prisma/prisma-global-reviewer-comment.repository';
import { CreateGlobalSubmissionCommand } from './application/commands/create-global-submission.command';
import { SetHunterWriterCommand } from './application/commands/set-hunter-writer.command';
import { SetPrimaryHunterCommand } from './application/commands/set-primary-hunter.command';
import { ApproveGlobalSubmissionCommand } from './application/commands/approve-global-submission.command';
import { RequestGlobalSubmissionChangesCommand } from './application/commands/request-global-submission-changes.command';
import { ListGlobalSubmissionsQuery } from './application/queries/list-global-submissions.query';
import { GetGlobalSubmissionByIdQuery } from './application/queries/get-global-submission-by-id.query';
import { ListGlobalReviewerCommentsQuery } from './application/queries/list-global-reviewer-comments.query';
import { SaveReportDraftCommand } from './application/commands/save-report-draft.command';
import { GetReportDraftByIdQuery } from './application/queries/get-report-draft-by-id.query';
import { ListReportDraftsByHunterQuery } from './application/queries/list-report-drafts-by-hunter.query';
import { ListReportDraftsForFinalValidationQuery } from './application/queries/list-report-drafts-for-final-validation.query';
import { ListOrphanReportDraftsQuery } from './application/queries/list-orphan-report-drafts.query';
import { ListHuntersForCoordinatorQuery } from './application/queries/list-hunters-for-coordinator.query';
import { ReportTeamAccessPolicy } from '../report-team/application/report-team-access.policy';
import { SuperAdminFinalValidationService } from './application/admin/super-admin-final-validation.service';
import { DeleteReportDraftCommand } from './application/commands/delete-report-draft.command';
import { PrismaService } from '../core/infrastructure/database/prisma/prisma.service';
import { SaveSubmissionCommand } from './application/commands/save-submission.command';
import { GetSubmissionByIdQuery } from './application/queries/get-submission-by-id.query';
import { ListSubmissionsQuery } from './application/queries/list-submissions.query';
import { SaveReviewerCommentsCommand } from './application/commands/save-reviewer-comments.command';
import { ListReviewerCommentsQuery } from './application/queries/list-reviewer-comments.query';
import { ListReviewerCommentsForStepQuery } from './application/queries/list-reviewer-comments-for-step.query';
import { ReportDraftAccessPolicy } from './application/report-draft-access.policy';
import { ReportDraftImageAssetService } from './application/attachments/report-draft-image-asset.service';

@Module({
  imports: [AuthModule, ReportTeamModule, UserModule],
  controllers: [
    ReportDraftController,
    ReportDraftAdminController,
    ReportDraftCoordinationController,
    SubmissionController,
    GlobalSubmissionController,
    ReviewerCommentController,
  ],
  providers: [
    {
      provide: I_REPORT_DRAFT_REPOSITORY,
      useClass: PrismaReportDraftRepository,
    },
    {
      provide: I_SUBMISSION_REPOSITORY,
      useClass: PrismaSubmissionRepository,
    },
    {
      provide: I_REVIEWER_COMMENT_REPOSITORY,
      useClass: PrismaReviewerCommentRepository,
    },
    {
      provide: I_GLOBAL_SUBMISSION_REPOSITORY,
      useClass: PrismaGlobalSubmissionRepository,
    },
    {
      provide: I_GLOBAL_REVIEWER_COMMENT_REPOSITORY,
      useClass: PrismaGlobalReviewerCommentRepository,
    },
    {
      provide: ReportDraftAccessPolicy,
      inject: [
        I_REPORT_DRAFT_REPOSITORY,
        I_SUBMISSION_REPOSITORY,
        I_REPORT_TEAM_REPOSITORY,
        I_USER_REPOSITORY,
      ],
      useFactory: (
        reportDraftRepository: PrismaReportDraftRepository,
        submissionRepository: PrismaSubmissionRepository,
        reportTeamRepository: IReportTeamRepository,
        userRepository: IUserRepository,
      ) =>
        new ReportDraftAccessPolicy(
          reportDraftRepository,
          submissionRepository,
          reportTeamRepository,
          userRepository,
        ),
    },
    {
      provide: SaveReportDraftCommand,
      inject: [I_REPORT_DRAFT_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) => new SaveReportDraftCommand(repository, access),
    },
    {
      provide: SetHunterWriterCommand,
      inject: [I_REPORT_DRAFT_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) => new SetHunterWriterCommand(repository, access),
    },
    {
      provide: SetPrimaryHunterCommand,
      inject: [I_REPORT_DRAFT_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) => new SetPrimaryHunterCommand(repository, access),
    },
    ReportDraftImageAssetService,
    {
      provide: GetReportDraftByIdQuery,
      inject: [I_REPORT_DRAFT_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) => new GetReportDraftByIdQuery(repository, access),
    },
    {
      provide: ListReportDraftsByHunterQuery,
      inject: [I_REPORT_DRAFT_REPOSITORY],
      useFactory: (repository: PrismaReportDraftRepository) =>
        new ListReportDraftsByHunterQuery(repository),
    },
    {
      provide: ListReportDraftsForFinalValidationQuery,
      inject: [I_REPORT_DRAFT_REPOSITORY],
      useFactory: (repository: PrismaReportDraftRepository) =>
        new ListReportDraftsForFinalValidationQuery(repository),
    },
    {
      provide: ListOrphanReportDraftsQuery,
      inject: [I_REPORT_DRAFT_REPOSITORY],
      useFactory: (repository: PrismaReportDraftRepository) =>
        new ListOrphanReportDraftsQuery(repository),
    },
    {
      provide: ListHuntersForCoordinatorQuery,
      inject: [I_USER_REPOSITORY, ReportTeamAccessPolicy],
      useFactory: (
        userRepository: IUserRepository,
        teamAccess: ReportTeamAccessPolicy,
      ) => new ListHuntersForCoordinatorQuery(userRepository, teamAccess),
    },
    {
      provide: DeleteReportDraftCommand,
      inject: [I_REPORT_DRAFT_REPOSITORY],
      useFactory: (repository: PrismaReportDraftRepository) =>
        new DeleteReportDraftCommand(repository),
    },
    {
      provide: SuperAdminFinalValidationService,
      inject: [
        PrismaService,
        I_REPORT_DRAFT_REPOSITORY,
        I_GLOBAL_SUBMISSION_REPOSITORY,
        I_SUBMISSION_REPOSITORY,
        I_REVIEWER_COMMENT_REPOSITORY,
      ],
      useFactory: (
        prisma: PrismaService,
        reportDraftRepository: PrismaReportDraftRepository,
        globalSubmissionRepository: PrismaGlobalSubmissionRepository,
        submissionRepository: PrismaSubmissionRepository,
        commentRepository: PrismaReviewerCommentRepository,
      ) =>
        new SuperAdminFinalValidationService(
          prisma,
          reportDraftRepository,
          globalSubmissionRepository,
          submissionRepository,
          commentRepository,
        ),
    },
    {
      provide: SaveSubmissionCommand,
      inject: [I_SUBMISSION_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaSubmissionRepository,
        access: ReportDraftAccessPolicy,
      ) => new SaveSubmissionCommand(repository, access),
    },
    {
      provide: GetSubmissionByIdQuery,
      inject: [I_SUBMISSION_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaSubmissionRepository,
        access: ReportDraftAccessPolicy,
      ) => new GetSubmissionByIdQuery(repository, access),
    },
    {
      provide: ListSubmissionsQuery,
      inject: [
        I_SUBMISSION_REPOSITORY,
        I_REPORT_DRAFT_REPOSITORY,
        ReportDraftAccessPolicy,
        I_REPORT_TEAM_REPOSITORY,
      ],
      useFactory: (
        repository: PrismaSubmissionRepository,
        reportDraftRepository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
        reportTeamRepository: IReportTeamRepository,
      ) =>
        new ListSubmissionsQuery(
          repository,
          reportDraftRepository,
          access,
          reportTeamRepository,
        ),
    },
    {
      provide: SaveReviewerCommentsCommand,
      inject: [I_REVIEWER_COMMENT_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaReviewerCommentRepository,
        access: ReportDraftAccessPolicy,
      ) => new SaveReviewerCommentsCommand(repository, access),
    },
    {
      provide: ListReviewerCommentsQuery,
      inject: [I_REVIEWER_COMMENT_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaReviewerCommentRepository,
        access: ReportDraftAccessPolicy,
      ) => new ListReviewerCommentsQuery(repository, access),
    },
    {
      provide: CreateGlobalSubmissionCommand,
      inject: [
        I_GLOBAL_SUBMISSION_REPOSITORY,
        I_REPORT_DRAFT_REPOSITORY,
        ReportDraftAccessPolicy,
      ],
      useFactory: (
        globalSubmissionRepository: PrismaGlobalSubmissionRepository,
        reportDraftRepository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) =>
        new CreateGlobalSubmissionCommand(
          globalSubmissionRepository,
          reportDraftRepository,
          access,
        ),
    },
    {
      provide: ApproveGlobalSubmissionCommand,
      inject: [
        I_GLOBAL_SUBMISSION_REPOSITORY,
        I_REPORT_DRAFT_REPOSITORY,
        ReportDraftAccessPolicy,
      ],
      useFactory: (
        globalSubmissionRepository: PrismaGlobalSubmissionRepository,
        reportDraftRepository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) =>
        new ApproveGlobalSubmissionCommand(
          globalSubmissionRepository,
          reportDraftRepository,
          access,
        ),
    },
    {
      provide: RequestGlobalSubmissionChangesCommand,
      inject: [
        I_GLOBAL_SUBMISSION_REPOSITORY,
        I_GLOBAL_REVIEWER_COMMENT_REPOSITORY,
        I_REPORT_DRAFT_REPOSITORY,
        ReportDraftAccessPolicy,
      ],
      useFactory: (
        globalSubmissionRepository: PrismaGlobalSubmissionRepository,
        commentRepository: PrismaGlobalReviewerCommentRepository,
        reportDraftRepository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) =>
        new RequestGlobalSubmissionChangesCommand(
          globalSubmissionRepository,
          commentRepository,
          reportDraftRepository,
          access,
        ),
    },
    {
      provide: ListGlobalReviewerCommentsQuery,
      inject: [
        I_GLOBAL_SUBMISSION_REPOSITORY,
        I_GLOBAL_REVIEWER_COMMENT_REPOSITORY,
        ReportDraftAccessPolicy,
      ],
      useFactory: (
        globalSubmissionRepository: PrismaGlobalSubmissionRepository,
        commentRepository: PrismaGlobalReviewerCommentRepository,
        access: ReportDraftAccessPolicy,
      ) =>
        new ListGlobalReviewerCommentsQuery(
          globalSubmissionRepository,
          commentRepository,
          access,
        ),
    },
    {
      provide: ListGlobalSubmissionsQuery,
      inject: [
        I_GLOBAL_SUBMISSION_REPOSITORY,
        I_REPORT_DRAFT_REPOSITORY,
        ReportDraftAccessPolicy,
      ],
      useFactory: (
        repository: PrismaGlobalSubmissionRepository,
        reportDraftRepository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) =>
        new ListGlobalSubmissionsQuery(
          repository,
          reportDraftRepository,
          access,
        ),
    },
    {
      provide: GetGlobalSubmissionByIdQuery,
      inject: [
        I_GLOBAL_SUBMISSION_REPOSITORY,
        I_REPORT_DRAFT_REPOSITORY,
        ReportDraftAccessPolicy,
      ],
      useFactory: (
        globalSubmissionRepository: PrismaGlobalSubmissionRepository,
        reportDraftRepository: PrismaReportDraftRepository,
        access: ReportDraftAccessPolicy,
      ) =>
        new GetGlobalSubmissionByIdQuery(
          globalSubmissionRepository,
          reportDraftRepository,
          access,
        ),
    },
    {
      provide: ListReviewerCommentsForStepQuery,
      inject: [
        I_REVIEWER_COMMENT_REPOSITORY,
        I_SUBMISSION_REPOSITORY,
        ReportDraftAccessPolicy,
      ],
      useFactory: (
        commentRepository: PrismaReviewerCommentRepository,
        submissionRepository: PrismaSubmissionRepository,
        access: ReportDraftAccessPolicy,
      ) =>
        new ListReviewerCommentsForStepQuery(
          commentRepository,
          submissionRepository,
          access,
        ),
    },
  ],
  exports: [
    I_REPORT_DRAFT_REPOSITORY,
    I_SUBMISSION_REPOSITORY,
    I_GLOBAL_SUBMISSION_REPOSITORY,
    I_GLOBAL_REVIEWER_COMMENT_REPOSITORY,
    I_REVIEWER_COMMENT_REPOSITORY,
  ],
})
export class ReportDraftModule {}
