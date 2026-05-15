import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../../auth/auth.decorator';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import {
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import type {
  ReviewerRoleWire,
  SubmissionWire,
} from '../models/report-draft-api.types';
import { SaveSubmissionCommand } from '../application/commands/save-submission.command';
import { GetSubmissionByIdQuery } from '../application/queries/get-submission-by-id.query';
import { ListSubmissionsQuery } from '../application/queries/list-submissions.query';

@ApiTags('report-drafts')
@ApiBearerAuth()
@Controller('report-drafts/submissions')
export class SubmissionController {
  constructor(
    private readonly saveSubmission: SaveSubmissionCommand,
    private readonly getSubmissionById: GetSubmissionByIdQuery,
    private readonly listSubmissions: ListSubmissionsQuery,
  ) {}

  @Put()
  @Auth()
  @ApiOperation({ summary: 'Create or update a submission snapshot' })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to save this submission.')
  @ApiHttpInternalServerError('Unexpected error while saving submission.')
  async save(
    @Req() request: RequestWithIdentity,
    @Body() submission: SubmissionWire,
  ): Promise<{ ok: true }> {
    await this.saveSubmission.execute(request.user, submission);
    return { ok: true };
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List submissions (by draft or reviewer role)' })
  @ApiOkResponse({ description: 'Array of submissions' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to list these submissions.')
  @ApiHttpInternalServerError('Unexpected error while listing submissions.')
  async list(
    @Req() request: RequestWithIdentity,
    @Query('draftId') draftId?: string,
    @Query('pendingForReviewer') pendingForReviewer?: string,
    @Query('forReviewer') forReviewer?: string,
  ): Promise<SubmissionWire[]> {
    if (forReviewer) {
      return this.listSubmissions.execute(request.user, {
        kind: 'forReviewer',
        reviewerRole: forReviewer as ReviewerRoleWire,
      });
    }
    if (pendingForReviewer) {
      return this.listSubmissions.execute(request.user, {
        kind: 'pendingForReviewer',
        reviewerRole: pendingForReviewer as ReviewerRoleWire,
      });
    }
    if (draftId?.trim()) {
      return this.listSubmissions.execute(request.user, {
        kind: 'draftId',
        draftId: draftId.trim(),
      });
    }
    return [];
  }

  @Get(':submissionId')
  @Auth()
  @ApiOperation({ summary: 'Get one submission by id' })
  @ApiOkResponse({ description: 'Submission JSON' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Not allowed to read this submission.')
  @ApiHttpInternalServerError('Unexpected error while loading submission.')
  async getById(
    @Req() request: RequestWithIdentity,
    @Param('submissionId') submissionId: string,
  ): Promise<SubmissionWire> {
    const submission = await this.getSubmissionById.execute(
      request.user,
      submissionId,
    );
    if (submission === null) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }
}
