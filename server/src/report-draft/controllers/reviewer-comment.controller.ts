import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
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
import type { ReviewerCommentWire } from '../models/report-draft-api.types';
import { SaveReviewerCommentsCommand } from '../application/commands/save-reviewer-comments.command';
import { ListReviewerCommentsQuery } from '../application/queries/list-reviewer-comments.query';
import { ListReviewerCommentsForStepQuery } from '../application/queries/list-reviewer-comments-for-step.query';

@ApiTags('report-drafts')
@ApiBearerAuth()
@Controller('report-drafts/comments')
export class ReviewerCommentController {
  constructor(
    private readonly saveReviewerComments: SaveReviewerCommentsCommand,
    private readonly listReviewerComments: ListReviewerCommentsQuery,
    private readonly listReviewerCommentsForStep: ListReviewerCommentsForStepQuery,
  ) {}

  @Get()
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'List reviewer comments for a submission' })
  @ApiOkResponse({ description: 'Array of reviewer comments' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to read these comments.')
  @ApiHttpInternalServerError('Unexpected error while listing comments.')
  async list(
    @Req() request: RequestWithIdentity,
    @Query('submissionId') submissionId?: string,
    @Query('forStep') forStep?: string,
  ): Promise<ReviewerCommentWire[]> {
    if (!submissionId?.trim()) {
      return [];
    }
    const id = submissionId.trim();
    if (forStep === 'true' || forStep === '1') {
      return this.listReviewerCommentsForStep.execute(request.user, id);
    }
    return this.listReviewerComments.execute(request.user, id);
  }

  @Post()
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'Save reviewer comments (batch)' })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to save these comments.')
  @ApiHttpInternalServerError('Unexpected error while saving comments.')
  async saveMany(
    @Req() request: RequestWithIdentity,
    @Body() comments: ReviewerCommentWire[],
  ): Promise<{ ok: true }> {
    await this.saveReviewerComments.execute(request.user, comments);
    return { ok: true };
  }
}
