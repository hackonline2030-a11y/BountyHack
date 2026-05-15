import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../core/infrastructure/database/prisma/prisma.module';
import { ReportTeamController } from './controllers/report-team.controller';
import { JoinRequestController } from './controllers/join-request.controller';
import { I_REPORT_TEAM_REPOSITORY } from './ports/report-team-repository.interface';
import { I_JOIN_REQUEST_REPOSITORY } from './ports/join-request-repository.interface';
import { PrismaReportTeamRepository } from './adapters/postgre-prisma/prisma-report-team.repository';
import { PrismaJoinRequestRepository } from './adapters/postgre-prisma/prisma-join-request.repository';
import { ReportTeamAccessPolicy } from './application/report-team-access.policy';
import { ReportTeamMemberRoleResolver } from './application/report-team-member-role.resolver';
import { CreateReportTeamCommand } from './application/commands/create-report-team.command';
import { UpdateReportTeamCommand } from './application/commands/update-report-team.command';
import { DeleteReportTeamCommand } from './application/commands/delete-report-team.command';
import { CreateEnrollmentRequestCommand } from './application/commands/create-enrollment-request.command';
import { CreateJoinRequestCommand } from './application/commands/create-join-request.command';
import { DecideJoinRequestCommand } from './application/commands/decide-join-request.command';
import { ListMyReportTeamsQuery } from './application/queries/list-my-report-teams.query';
import { ListAllReportTeamsQuery } from './application/queries/list-all-report-teams.query';
import { GetReportTeamByIdQuery } from './application/queries/get-report-team-by-id.query';
import { GetReportTeamByDraftIdQuery } from './application/queries/get-report-team-by-draft-id.query';
import { ListJoinableReportTeamsQuery } from './application/queries/list-joinable-report-teams.query';
import { ListMyJoinRequestsQuery } from './application/queries/list-my-join-requests.query';
import { ListPendingJoinRequestsQuery } from './application/queries/list-pending-join-requests.query';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ReportTeamController, JoinRequestController],
  exports: [I_REPORT_TEAM_REPOSITORY],
  providers: [
    ReportTeamMemberRoleResolver,
    {
      provide: I_REPORT_TEAM_REPOSITORY,
      useClass: PrismaReportTeamRepository,
    },
    {
      provide: I_JOIN_REQUEST_REPOSITORY,
      useClass: PrismaJoinRequestRepository,
    },
    {
      provide: ReportTeamAccessPolicy,
      inject: [I_REPORT_TEAM_REPOSITORY],
      useFactory: (teamRepository: PrismaReportTeamRepository) =>
        new ReportTeamAccessPolicy(teamRepository),
    },
    {
      provide: CreateReportTeamCommand,
      inject: [
        I_REPORT_TEAM_REPOSITORY,
        ReportTeamAccessPolicy,
        ReportTeamMemberRoleResolver,
      ],
      useFactory: (
        repository: PrismaReportTeamRepository,
        access: ReportTeamAccessPolicy,
        memberRoleResolver: ReportTeamMemberRoleResolver,
      ) => new CreateReportTeamCommand(repository, access, memberRoleResolver),
    },
    {
      provide: UpdateReportTeamCommand,
      inject: [I_REPORT_TEAM_REPOSITORY, ReportTeamAccessPolicy],
      useFactory: (
        repository: PrismaReportTeamRepository,
        access: ReportTeamAccessPolicy,
      ) => new UpdateReportTeamCommand(repository, access),
    },
    {
      provide: DeleteReportTeamCommand,
      inject: [I_REPORT_TEAM_REPOSITORY, ReportTeamAccessPolicy],
      useFactory: (
        repository: PrismaReportTeamRepository,
        access: ReportTeamAccessPolicy,
      ) => new DeleteReportTeamCommand(repository, access),
    },
    {
      provide: CreateJoinRequestCommand,
      inject: [
        I_JOIN_REQUEST_REPOSITORY,
        ReportTeamAccessPolicy,
        ReportTeamMemberRoleResolver,
      ],
      useFactory: (
        repository: PrismaJoinRequestRepository,
        access: ReportTeamAccessPolicy,
        memberRoleResolver: ReportTeamMemberRoleResolver,
      ) =>
        new CreateJoinRequestCommand(repository, access, memberRoleResolver),
    },
    {
      provide: CreateEnrollmentRequestCommand,
      inject: [
        I_JOIN_REQUEST_REPOSITORY,
        ReportTeamAccessPolicy,
        ReportTeamMemberRoleResolver,
      ],
      useFactory: (
        repository: PrismaJoinRequestRepository,
        access: ReportTeamAccessPolicy,
        memberRoleResolver: ReportTeamMemberRoleResolver,
      ) =>
        new CreateEnrollmentRequestCommand(
          repository,
          access,
          memberRoleResolver,
        ),
    },
    {
      provide: DecideJoinRequestCommand,
      inject: [I_JOIN_REQUEST_REPOSITORY, ReportTeamAccessPolicy],
      useFactory: (
        repository: PrismaJoinRequestRepository,
        access: ReportTeamAccessPolicy,
      ) => new DecideJoinRequestCommand(repository, access),
    },
    {
      provide: ListMyReportTeamsQuery,
      inject: [I_REPORT_TEAM_REPOSITORY],
      useFactory: (repository: PrismaReportTeamRepository) =>
        new ListMyReportTeamsQuery(repository),
    },
    {
      provide: ListAllReportTeamsQuery,
      inject: [I_REPORT_TEAM_REPOSITORY, ReportTeamAccessPolicy],
      useFactory: (
        repository: PrismaReportTeamRepository,
        access: ReportTeamAccessPolicy,
      ) => new ListAllReportTeamsQuery(repository, access),
    },
    {
      provide: GetReportTeamByIdQuery,
      inject: [I_REPORT_TEAM_REPOSITORY, ReportTeamAccessPolicy],
      useFactory: (
        repository: PrismaReportTeamRepository,
        access: ReportTeamAccessPolicy,
      ) => new GetReportTeamByIdQuery(repository, access),
    },
    {
      provide: GetReportTeamByDraftIdQuery,
      inject: [I_REPORT_TEAM_REPOSITORY, ReportTeamAccessPolicy],
      useFactory: (
        repository: PrismaReportTeamRepository,
        access: ReportTeamAccessPolicy,
      ) => new GetReportTeamByDraftIdQuery(repository, access),
    },
    {
      provide: ListJoinableReportTeamsQuery,
      inject: [I_REPORT_TEAM_REPOSITORY],
      useFactory: (repository: PrismaReportTeamRepository) =>
        new ListJoinableReportTeamsQuery(repository),
    },
    {
      provide: ListMyJoinRequestsQuery,
      inject: [I_JOIN_REQUEST_REPOSITORY],
      useFactory: (repository: PrismaJoinRequestRepository) =>
        new ListMyJoinRequestsQuery(repository),
    },
    {
      provide: ListPendingJoinRequestsQuery,
      inject: [I_JOIN_REQUEST_REPOSITORY, ReportTeamAccessPolicy],
      useFactory: (
        repository: PrismaJoinRequestRepository,
        access: ReportTeamAccessPolicy,
      ) => new ListPendingJoinRequestsQuery(repository, access),
    },
  ],
})
export class ReportTeamModule {}
