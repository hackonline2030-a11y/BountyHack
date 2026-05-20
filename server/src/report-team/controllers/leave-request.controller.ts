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
} from '../../shared/rbac/report-workflow-auth.decorator';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import {
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import type {
  CreateLeaveRequestInput,
  ReportTeamLeaveRequestWire,
} from '../models/report-team-api.types';
import { CreateLeaveRequestCommand } from '../application/commands/create-leave-request.command';
import { DecideLeaveRequestCommand } from '../application/commands/decide-leave-request.command';
import { ListMyLeaveRequestsQuery } from '../application/queries/list-my-leave-requests.query';
import { ListPendingLeaveRequestsQuery } from '../application/queries/list-pending-leave-requests.query';

@ApiTags('report-drafts')
@ApiBearerAuth()
@Controller('report-drafts/report-teams/leave-requests')
export class LeaveRequestController {
  constructor(
    private readonly createLeaveRequest: CreateLeaveRequestCommand,
    private readonly decideLeaveRequest: DecideLeaveRequestCommand,
    private readonly listMyLeaveRequests: ListMyLeaveRequestsQuery,
    private readonly listPendingLeaveRequests: ListPendingLeaveRequestsQuery,
  ) {}

  @Get('mine')
  @AuthReportTeamMember()
  @ApiOperation({ summary: 'List leave requests created by the caller' })
  @ApiOkResponse({ description: 'Array of leave requests' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected error while listing leave requests.')
  async listMine(
    @Req() request: RequestWithIdentity,
  ): Promise<ReportTeamLeaveRequestWire[]> {
    return this.listMyLeaveRequests.execute(request.user);
  }

  @Get('pending')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({ summary: 'List pending primary-hunter leave requests (coordinator)' })
  @ApiOkResponse({ description: 'Array of pending leave requests' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while listing pending leave requests.')
  async listPending(
    @Req() request: RequestWithIdentity,
  ): Promise<ReportTeamLeaveRequestWire[]> {
    return this.listPendingLeaveRequests.execute(request.user);
  }

  @Post()
  @AuthReportTeamMember()
  @ApiOperation({
    summary: 'Primary hunter asks coordinator to remove them from the team',
  })
  @ApiOkResponse({ description: 'Created leave request' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to create this leave request.')
  @ApiHttpInternalServerError('Unexpected error while creating leave request.')
  async create(
    @Req() request: RequestWithIdentity,
    @Body() body: CreateLeaveRequestInput,
  ): Promise<ReportTeamLeaveRequestWire> {
    return this.createLeaveRequest.execute(request.user, body);
  }

  @Post(':requestId/approve')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({
    summary: 'Mark leave request as handled (coordinator changed primary / removed member)',
  })
  @ApiOkResponse({ description: 'Updated leave request' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while approving leave request.')
  async approve(
    @Req() request: RequestWithIdentity,
    @Param('requestId') requestId: string,
  ): Promise<ReportTeamLeaveRequestWire> {
    return this.decideLeaveRequest.execute(request.user, requestId, 'approve');
  }

  @Post(':requestId/reject')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({ summary: 'Dismiss a leave request (coordinator)' })
  @ApiOkResponse({ description: 'Updated leave request' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while rejecting leave request.')
  async reject(
    @Req() request: RequestWithIdentity,
    @Param('requestId') requestId: string,
  ): Promise<ReportTeamLeaveRequestWire> {
    return this.decideLeaveRequest.execute(request.user, requestId, 'reject');
  }
}
