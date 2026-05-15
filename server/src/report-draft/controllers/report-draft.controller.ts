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
import type { ReportDraftWire } from '../models/report-draft-api.types';
import { SaveReportDraftCommand } from '../application/commands/save-report-draft.command';
import { GetReportDraftByIdQuery } from '../application/queries/get-report-draft-by-id.query';
import { ListReportDraftsByHunterQuery } from '../application/queries/list-report-drafts-by-hunter.query';

@ApiTags('report-drafts')
@ApiBearerAuth()
@Controller('report-drafts')
export class ReportDraftController {
  constructor(
    private readonly saveReportDraft: SaveReportDraftCommand,
    private readonly getReportDraftById: GetReportDraftByIdQuery,
    private readonly listReportDraftsByHunter: ListReportDraftsByHunterQuery,
  ) {}

  @Put()
  @Auth()
  @ApiOperation({ summary: 'Create or update a report draft aggregate' })
  @ApiOkResponse({
    description: 'Draft persisted',
    schema: { example: { ok: true } },
  })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Draft hunterId does not match authenticated user.')
  @ApiHttpInternalServerError('Unexpected error while saving report draft.')
  async save(
    @Req() request: RequestWithIdentity,
    @Body() draft: ReportDraftWire,
  ): Promise<{ ok: true }> {
    await this.saveReportDraft.execute(request.user, draft);
    return { ok: true };
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List report drafts for a hunter' })
  @ApiOkResponse({ description: 'Array of report drafts' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('hunterId query does not match authenticated user.')
  @ApiHttpInternalServerError('Unexpected error while listing report drafts.')
  async listByHunter(
    @Req() request: RequestWithIdentity,
    @Query('hunterId') hunterId: string,
  ): Promise<ReportDraftWire[]> {
    if (!hunterId?.trim()) {
      return [];
    }
    return this.listReportDraftsByHunter.execute(
      request.user,
      hunterId.trim(),
    );
  }

  @Get(':draftId')
  @Auth()
  @ApiOperation({ summary: 'Get one report draft by id' })
  @ApiOkResponse({ description: 'Report draft JSON' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Draft does not belong to authenticated user.')
  @ApiHttpInternalServerError('Unexpected error while loading report draft.')
  async getById(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
  ): Promise<ReportDraftWire> {
    const draft = await this.getReportDraftById.execute(request.user, draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    return draft;
  }
}
