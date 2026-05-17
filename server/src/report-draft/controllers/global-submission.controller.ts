import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { AuthReportWorkflowParticipant } from '../../shared/rbac/report-workflow-auth.decorator';
import {
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import type {
  GlobalReviewerCommentWire,
  GlobalSubmissionWire,
} from '../models/global-submission-api.types';
import type {
  ReportDraftWire,
  ReviewerRoleWire,
} from '../models/report-draft-api.types';
import { CreateGlobalSubmissionCommand } from '../application/commands/create-global-submission.command';
import { ApproveGlobalSubmissionCommand } from '../application/commands/approve-global-submission.command';
import { RequestGlobalSubmissionChangesCommand } from '../application/commands/request-global-submission-changes.command';
import { GetGlobalSubmissionByIdQuery } from '../application/queries/get-global-submission-by-id.query';
import { ListGlobalSubmissionsQuery } from '../application/queries/list-global-submissions.query';
import { ListGlobalReviewerCommentsQuery } from '../application/queries/list-global-reviewer-comments.query';

@ApiTags('report-drafts')
@ApiBearerAuth()
@Controller('report-drafts/global-submissions')
export class GlobalSubmissionController {
  constructor(
    private readonly createGlobalSubmission: CreateGlobalSubmissionCommand,
    private readonly approveGlobalSubmission: ApproveGlobalSubmissionCommand,
    private readonly requestGlobalSubmissionChanges: RequestGlobalSubmissionChangesCommand,
    private readonly listGlobalSubmissions: ListGlobalSubmissionsQuery,
    private readonly getGlobalSubmissionById: GetGlobalSubmissionByIdQuery,
    private readonly listGlobalReviewerComments: ListGlobalReviewerCommentsQuery,
  ) {}

  @Post()
  @AuthReportWorkflowParticipant()
  @ApiOperation({
    summary:
      'Hunter submits the whole draft for parallel global review (QC + super-admin tracks)',
  })
  @ApiOkResponse({ description: 'Global submission rows created (QC and super-admin)' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to submit this draft globally.')
  @ApiHttpInternalServerError('Unexpected error while creating global submission.')
  async create(
    @Req() request: RequestWithIdentity,
    @Body() body: { draftId: string },
  ): Promise<GlobalSubmissionWire[]> {
    return this.createGlobalSubmission.execute(request.user, body.draftId);
  }

  @Get()
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'List global submissions' })
  @ApiOkResponse({ description: 'Array of global submissions' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to list these global submissions.')
  @ApiHttpInternalServerError('Unexpected error while listing global submissions.')
  async list(
    @Req() request: RequestWithIdentity,
    @Query('draftId') draftId?: string,
    @Query('pendingForReviewer') pendingForReviewer?: string,
    @Query('forReviewer') forReviewer?: string,
  ): Promise<GlobalSubmissionWire[]> {
    if (pendingForReviewer) {
      return this.listGlobalSubmissions.execute(request.user, {
        kind: 'pendingForReviewer',
        reviewerRole: pendingForReviewer as ReviewerRoleWire,
      });
    }
    if (forReviewer) {
      return this.listGlobalSubmissions.execute(request.user, {
        kind: 'forReviewer',
        reviewerRole: forReviewer as ReviewerRoleWire,
      });
    }
    if (draftId?.trim()) {
      return this.listGlobalSubmissions.execute(request.user, {
        kind: 'draftId',
        draftId: draftId.trim(),
      });
    }
    return [];
  }

  @Get(':globalSubmissionId')
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'Get one global submission' })
  @ApiOkResponse({ description: 'Global submission JSON' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to read this global submission.')
  @ApiHttpInternalServerError('Unexpected error while loading global submission.')
  async getById(
    @Req() request: RequestWithIdentity,
    @Param('globalSubmissionId') globalSubmissionId: string,
  ): Promise<GlobalSubmissionWire> {
    const row = await this.getGlobalSubmissionById.execute(
      request.user,
      globalSubmissionId,
    );
    if (row === null) {
      throw new NotFoundException('Global submission not found');
    }
    return row;
  }

  @Get(':globalSubmissionId/comments')
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'List comments on a global submission' })
  @ApiOkResponse({ description: 'Array of global reviewer comments' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to read these comments.')
  @ApiHttpInternalServerError('Unexpected error while listing global submission comments.')
  async listComments(
    @Req() request: RequestWithIdentity,
    @Param('globalSubmissionId') globalSubmissionId: string,
  ): Promise<GlobalReviewerCommentWire[]> {
    return this.listGlobalReviewerComments.execute(request.user, globalSubmissionId);
  }

  @Post(':globalSubmissionId/approve')
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'Approve global revision (not final report validation)' })
  @ApiOkResponse({ description: 'Updated report draft' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to approve this global submission.')
  @ApiHttpInternalServerError('Unexpected error while approving global submission.')
  async approve(
    @Req() request: RequestWithIdentity,
    @Param('globalSubmissionId') globalSubmissionId: string,
  ): Promise<ReportDraftWire> {
    return this.approveGlobalSubmission.execute(request.user, globalSubmissionId);
  }

  @Post(':globalSubmissionId/request-changes')
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'QC requests changes on a global submission' })
  @ApiOkResponse({ description: 'Updated report draft' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to request changes on this global submission.')
  @ApiHttpInternalServerError('Unexpected error while requesting global submission changes.')
  async requestChanges(
    @Req() request: RequestWithIdentity,
    @Param('globalSubmissionId') globalSubmissionId: string,
    @Body() body: { comments?: string[]; comment?: string },
  ): Promise<ReportDraftWire> {
    const bodies =
      body.comments ??
      (body.comment?.trim() ? [body.comment.trim()] : []);
    return this.requestGlobalSubmissionChanges.execute(
      request.user,
      globalSubmissionId,
      bodies,
    );
  }
}
