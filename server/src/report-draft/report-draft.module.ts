import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReportTeamModule } from '../report-team/report-team.module';
import { I_REPORT_TEAM_REPOSITORY } from '../report-team/ports/report-team-repository.interface';
import type { IReportTeamRepository } from '../report-team/ports/report-team-repository.interface';
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
import { ListReviewerCommentsForStepQuery } from './application/queries/list-reviewer-comments-for-step.query';
import { ReportDraftAccessPolicy } from './application/report-draft-access.policy';

@Module({
  imports: [AuthModule, ReportTeamModule],
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
      inject: [
        I_REPORT_DRAFT_REPOSITORY,
        I_SUBMISSION_REPOSITORY,
        I_REPORT_TEAM_REPOSITORY,
      ],
      useFactory: (
        reportDraftRepository: PrismaReportDraftRepository,
        submissionRepository: PrismaSubmissionRepository,
        reportTeamRepository: IReportTeamRepository,
      ) =>
        new ReportDraftAccessPolicy(
          reportDraftRepository,
          submissionRepository,
          reportTeamRepository,
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
        ReportDraftAccessPolicy,
        I_REPORT_TEAM_REPOSITORY,
      ],
      useFactory: (
        repository: PrismaSubmissionRepository,
        access: ReportDraftAccessPolicy,
        reportTeamRepository: IReportTeamRepository,
      ) =>
        new ListSubmissionsQuery(repository, access, reportTeamRepository),
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
    I_REVIEWER_COMMENT_REPOSITORY,
  ],
})
export class ReportDraftModule {}
