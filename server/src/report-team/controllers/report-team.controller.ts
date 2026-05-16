import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthCoordinatorOrSuperAdmin,
  AuthReportWorkflowParticipant,
} from '../../shared/rbac/report-workflow-auth.decorator';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import {
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import type {
  CreateReportTeamInput,
  ReportTeamWire,
  UpdateReportTeamInput,
} from '../models/report-team-api.types';
import { CreateReportTeamCommand } from '../application/commands/create-report-team.command';
import { UpdateReportTeamCommand } from '../application/commands/update-report-team.command';
import { DeleteReportTeamCommand } from '../application/commands/delete-report-team.command';
import { ListMyReportTeamsQuery } from '../application/queries/list-my-report-teams.query';
import { ListAllReportTeamsQuery } from '../application/queries/list-all-report-teams.query';
import { GetReportTeamByIdQuery } from '../application/queries/get-report-team-by-id.query';
import { GetReportTeamByDraftIdQuery } from '../application/queries/get-report-team-by-draft-id.query';
import { ListJoinableReportTeamsQuery } from '../application/queries/list-joinable-report-teams.query';

@ApiTags('report-drafts')
@ApiBearerAuth()
@Controller('report-drafts/report-teams')
export class ReportTeamController {
  constructor(
    private readonly createReportTeam: CreateReportTeamCommand,
    private readonly updateReportTeam: UpdateReportTeamCommand,
    private readonly deleteReportTeam: DeleteReportTeamCommand,
    private readonly listMyReportTeams: ListMyReportTeamsQuery,
    private readonly listAllReportTeams: ListAllReportTeamsQuery,
    private readonly getReportTeamById: GetReportTeamByIdQuery,
    private readonly getReportTeamByDraftId: GetReportTeamByDraftIdQuery,
    private readonly listJoinableReportTeams: ListJoinableReportTeamsQuery,
  ) {}

  @Get('mine')
  @AuthReportWorkflowParticipant()
  @ApiOperation({
    summary: 'List report-draft teams the caller belongs to',
  })
  @ApiOkResponse({ description: 'Array of report-draft teams' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected error while listing report-draft teams.')
  async listMine(@Req() request: RequestWithIdentity): Promise<ReportTeamWire[]> {
    return this.listMyReportTeams.execute(request.user);
  }

  @Get('joinable')
  @AuthReportWorkflowParticipant()
  @ApiOperation({
    summary: 'List report-draft teams the caller may request to join',
  })
  @ApiOkResponse({ description: 'Array of joinable report-draft teams' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected error while listing joinable teams.')
  async listJoinable(
    @Req() request: RequestWithIdentity,
  ): Promise<ReportTeamWire[]> {
    return this.listJoinableReportTeams.execute(request.user);
  }

  @Get('by-draft/:reportDraftId')
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'Get the team for a report draft' })
  @ApiOkResponse({ description: 'Report-draft team JSON' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to read this report-draft team.')
  @ApiHttpInternalServerError('Unexpected error while loading report-draft team.')
  async getByDraft(
    @Req() request: RequestWithIdentity,
    @Param('reportDraftId') reportDraftId: string,
  ): Promise<ReportTeamWire> {
    return this.getReportTeamByDraftId.execute(request.user, reportDraftId);
  }

  @Get()
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({
    summary: 'List all report-draft teams (coordinator / super admin)',
  })
  @ApiOkResponse({ description: 'Array of report-draft teams' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while listing report-draft teams.')
  async listAll(@Req() request: RequestWithIdentity): Promise<ReportTeamWire[]> {
    return this.listAllReportTeams.execute(request.user);
  }

  @Get(':teamId')
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'Get one report-draft team by id' })
  @ApiOkResponse({ description: 'Report-draft team JSON' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to read this report-draft team.')
  @ApiHttpInternalServerError('Unexpected error while loading report-draft team.')
  async getById(
    @Req() request: RequestWithIdentity,
    @Param('teamId') teamId: string,
  ): Promise<ReportTeamWire> {
    return this.getReportTeamById.execute(request.user, teamId);
  }

  @Post()
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({
    summary: 'Create a report-draft team (coordinator)',
  })
  @ApiOkResponse({ description: 'Created report-draft team' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while creating report-draft team.')
  async create(
    @Req() request: RequestWithIdentity,
    @Body() body: CreateReportTeamInput,
  ): Promise<ReportTeamWire> {
    return this.createReportTeam.execute(request.user, body);
  }

  @Patch(':teamId')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({ summary: 'Update report-draft team label (coordinator)' })
  @ApiOkResponse({ description: 'Updated report-draft team' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while updating report-draft team.')
  async update(
    @Req() request: RequestWithIdentity,
    @Param('teamId') teamId: string,
    @Body() body: UpdateReportTeamInput,
  ): Promise<ReportTeamWire> {
    return this.updateReportTeam.execute(request.user, teamId, body);
  }

  @Delete(':teamId')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({ summary: 'Delete a report-draft team' })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while deleting report-draft team.')
  async remove(
    @Req() request: RequestWithIdentity,
    @Param('teamId') teamId: string,
  ): Promise<{ ok: true }> {
    await this.deleteReportTeam.execute(request.user, teamId);
    return { ok: true };
  }
}
