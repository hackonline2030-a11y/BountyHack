import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthCoordinatorOrSuperAdmin,
  AuthReportTeamMember,
  AuthReportWorkflowParticipant,
} from '../../shared/rbac/report-workflow-auth.decorator';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import {
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import type {
  CreateEnrollmentRequestInput,
  CreateJoinRequestInput,
  ReportTeamJoinRequestWire,
} from '../models/report-team-api.types';
import { CreateEnrollmentRequestCommand } from '../application/commands/create-enrollment-request.command';
import { CreateJoinRequestCommand } from '../application/commands/create-join-request.command';
import { DecideJoinRequestCommand } from '../application/commands/decide-join-request.command';
import { ListMyJoinRequestsQuery } from '../application/queries/list-my-join-requests.query';
import { ListPendingJoinRequestsQuery } from '../application/queries/list-pending-join-requests.query';

@ApiTags('report-drafts')
@ApiBearerAuth()
@Controller('report-drafts/report-teams/join-requests')
export class JoinRequestController {
  constructor(
    private readonly createJoinRequest: CreateJoinRequestCommand,
    private readonly createEnrollmentRequest: CreateEnrollmentRequestCommand,
    private readonly decideJoinRequest: DecideJoinRequestCommand,
    private readonly listMyJoinRequests: ListMyJoinRequestsQuery,
    private readonly listPendingJoinRequests: ListPendingJoinRequestsQuery,
  ) {}

  @Get('mine')
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'List join requests created by the caller' })
  @ApiOkResponse({ description: 'Array of join requests' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected error while listing join requests.')
  async listMine(
    @Req() request: RequestWithIdentity,
  ): Promise<ReportTeamJoinRequestWire[]> {
    return this.listMyJoinRequests.execute(request.user);
  }

  @Get('pending')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({ summary: 'List pending join requests (coordinator)' })
  @ApiOkResponse({ description: 'Array of pending join requests' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while listing pending join requests.')
  async listPending(
    @Req() request: RequestWithIdentity,
  ): Promise<ReportTeamJoinRequestWire[]> {
    return this.listPendingJoinRequests.execute(request.user);
  }

  @Post('enroll')
  @AuthReportTeamMember()
  @ApiOperation({
    summary: 'Ask coordinator to assign you to a report team (no team picked)',
  })
  @ApiOkResponse({ description: 'Created enrollment request' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to create this enrollment request.')
  @ApiHttpInternalServerError(
    'Unexpected error while creating enrollment request.',
  )
  async enroll(
    @Req() request: RequestWithIdentity,
    @Body() body: CreateEnrollmentRequestInput,
  ): Promise<ReportTeamJoinRequestWire> {
    return this.createEnrollmentRequest.execute(request.user, body);
  }

  @Post()
  @AuthReportTeamMember()
  @ApiOperation({ summary: 'Request to join a report-draft team' })
  @ApiOkResponse({ description: 'Created join request' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to create this join request.')
  @ApiHttpInternalServerError('Unexpected error while creating join request.')
  async create(
    @Req() request: RequestWithIdentity,
    @Body() body: CreateJoinRequestInput,
  ): Promise<ReportTeamJoinRequestWire> {
    return this.createJoinRequest.execute(request.user, body);
  }

  @Post(':requestId/approve')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({ summary: 'Approve a join request (coordinator)' })
  @ApiOkResponse({ description: 'Updated join request' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while approving join request.')
  async approve(
    @Req() request: RequestWithIdentity,
    @Param('requestId') requestId: string,
  ): Promise<ReportTeamJoinRequestWire> {
    return this.decideJoinRequest.execute(request.user, requestId, 'approve');
  }

  @Post(':requestId/reject')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({ summary: 'Reject a join request (coordinator)' })
  @ApiOkResponse({ description: 'Updated join request' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while rejecting join request.')
  async reject(
    @Req() request: RequestWithIdentity,
    @Param('requestId') requestId: string,
  ): Promise<ReportTeamJoinRequestWire> {
    return this.decideJoinRequest.execute(request.user, requestId, 'reject');
  }
}
