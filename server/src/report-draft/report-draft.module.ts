import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReportDraftController } from './controllers/report-draft.controller';
import { SubmissionController } from './controllers/submission.controller';
import { ReviewerCommentController } from './controllers/reviewer-comment.controller';
import { I_REPORT_DRAFT_REPOSITORY } from './ports/report-draft-repository.interface';
import { I_SUBMISSION_REPOSITORY } from './ports/submission-repository.interface';
import { I_REVIEWER_COMMENT_REPOSITORY } from './ports/reviewer-comment-repository.interface';
import { PrismaReportDraftRepository } from './adapters/postgre-prisma/prisma-report-draft.repository';
import { PrismaSubmissionRepository } from './adapters/postgre-prisma/prisma-submission.repository';
import { PrismaReviewerCommentRepository } from './adapters/postgre-prisma/prisma-reviewer-comment.repository';
import { SaveReportDraftCommand } from './application/commands/save-report-draft.command';
import { GetReportDraftByIdQuery } from './application/queries/get-report-draft-by-id.query';
import { ListReportDraftsByHunterQuery } from './application/queries/list-report-drafts-by-hunter.query';
import { SaveSubmissionCommand } from './application/commands/save-submission.command';
import { GetSubmissionByIdQuery } from './application/queries/get-submission-by-id.query';
import { ListSubmissionsQuery } from './application/queries/list-submissions.query';
import { SaveReviewerCommentsCommand } from './application/commands/save-reviewer-comments.command';
import { ListReviewerCommentsQuery } from './application/queries/list-reviewer-comments.query';
import { ReportDraftAccessPolicy } from './application/report-draft-access.policy';

@Module({
  imports: [AuthModule],
  controllers: [
    ReportDraftController,
    SubmissionController,
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
      provide: ReportDraftAccessPolicy,
      inject: [I_REPORT_DRAFT_REPOSITORY, I_SUBMISSION_REPOSITORY],
      useFactory: (
        reportDraftRepository: PrismaReportDraftRepository,
        submissionRepository: PrismaSubmissionRepository,
      ) =>
        new ReportDraftAccessPolicy(reportDraftRepository, submissionRepository),
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
      inject: [I_SUBMISSION_REPOSITORY, ReportDraftAccessPolicy],
      useFactory: (
        repository: PrismaSubmissionRepository,
        access: ReportDraftAccessPolicy,
      ) => new ListSubmissionsQuery(repository, access),
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
  ],
})
export class ReportDraftModule {}
