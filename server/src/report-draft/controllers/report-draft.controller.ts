import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { AuthReportWorkflowParticipant } from '../../shared/rbac/report-workflow-auth.decorator';
import {
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import type { ReportDraftWire } from '../models/report-draft-api.types';
import { SaveReportDraftCommand } from '../application/commands/save-report-draft.command';
import { GetReportDraftByIdQuery } from '../application/queries/get-report-draft-by-id.query';
import { ListReportDraftsByHunterQuery } from '../application/queries/list-report-drafts-by-hunter.query';
import { SetHunterWriterCommand } from '../application/commands/set-hunter-writer.command';
import { SetPrimaryHunterCommand } from '../application/commands/set-primary-hunter.command';
import { AuthCoordinatorOrSuperAdmin } from '../../shared/rbac/report-workflow-auth.decorator';
import { ReportDraftImageAssetService } from '../application/attachments/report-draft-image-asset.service';
import {
  REPORT_DRAFT_IMAGE_FIELD_NAME,
  REPORT_DRAFT_IMAGE_MAX_BYTES,
  type UploadedReportImageFile,
} from '../application/attachments/report-draft-image-storage';

@ApiTags('report-drafts')
@ApiBearerAuth()
@Controller('report-drafts')
export class ReportDraftController {
  constructor(
    private readonly saveReportDraft: SaveReportDraftCommand,
    private readonly getReportDraftById: GetReportDraftByIdQuery,
    private readonly listReportDraftsByHunter: ListReportDraftsByHunterQuery,
    private readonly imageAssets: ReportDraftImageAssetService,
    private readonly setHunterWriterCommand: SetHunterWriterCommand,
    private readonly setPrimaryHunterCommand: SetPrimaryHunterCommand,
  ) {}

  @Put()
  @AuthReportWorkflowParticipant()
  @ApiOperation({
    summary:
      'Persist updates to an existing report draft (draft row must already exist)',
  })
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

  @Patch('draft/:draftId/hunter-writer')
  @AuthReportWorkflowParticipant()
  @ApiOperation({
    summary:
      'Set which squad hunter may edit the draft and submit steps (hunter_writer_id)',
  })
  @ApiOkResponse({ description: 'Writer updated', schema: { example: { ok: true } } })
  async patchHunterWriter(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
    @Body() body: { hunterWriterId?: string },
  ): Promise<{ ok: true }> {
    await this.setHunterWriterCommand.execute(
      request.user,
      draftId,
      body.hunterWriterId ?? '',
    );
    return { ok: true };
  }

  @Patch('draft/:draftId/primary-hunter')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({
    summary:
      'Change the report draft owner (`hunter_id`) to another squad hunter (coordinator)',
  })
  @ApiOkResponse({ description: 'Primary hunter updated', schema: { example: { ok: true } } })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while updating primary hunter.')
  async patchPrimaryHunter(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
    @Body() body: { hunterId?: string },
  ): Promise<{ ok: true }> {
    await this.setPrimaryHunterCommand.execute(
      request.user,
      draftId,
      body.hunterId ?? '',
    );
    return { ok: true };
  }

  @Get()
  @AuthReportWorkflowParticipant()
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

  @Get('draft/:draftId')
  @AuthReportWorkflowParticipant()
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

  @Post('draft/:draftId/attachments/images')
  @AuthReportWorkflowParticipant()
  @UseInterceptors(
    FileInterceptor(REPORT_DRAFT_IMAGE_FIELD_NAME, {
      storage: memoryStorage(),
      limits: { fileSize: REPORT_DRAFT_IMAGE_MAX_BYTES, files: 1 },
    }),
  )
  @ApiOperation({ summary: 'Upload a private report image for a draft section' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        [REPORT_DRAFT_IMAGE_FIELD_NAME]: {
          type: 'string',
          format: 'binary',
        },
      },
      required: [REPORT_DRAFT_IMAGE_FIELD_NAME],
    },
  })
  @ApiOkResponse({ description: 'Uploaded image attachment metadata' })
  async uploadImage(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
    @UploadedFile() file?: UploadedReportImageFile,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }
    return this.imageAssets.uploadDescriptionImage(request.user, draftId, file);
  }

  @Post('draft/:draftId/steps/:stepKey/attachments/images')
  @AuthReportWorkflowParticipant()
  @UseInterceptors(
    FileInterceptor(REPORT_DRAFT_IMAGE_FIELD_NAME, {
      storage: memoryStorage(),
      limits: { fileSize: REPORT_DRAFT_IMAGE_MAX_BYTES, files: 1 },
    }),
  )
  @ApiOperation({ summary: 'Upload a private report image for a draft wizard step section' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        [REPORT_DRAFT_IMAGE_FIELD_NAME]: {
          type: 'string',
          format: 'binary',
        },
      },
      required: [REPORT_DRAFT_IMAGE_FIELD_NAME],
    },
  })
  @ApiOkResponse({ description: 'Uploaded image attachment metadata' })
  async uploadStepImage(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
    @Param('stepKey') stepKey: string,
    @UploadedFile() file?: UploadedReportImageFile,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }
    const parsedStepKey = this.imageAssets.parseStepKeyParam(stepKey);
    return this.imageAssets.uploadStepSectionImage(
      request.user,
      draftId,
      parsedStepKey,
      file,
    );
  }

  @Get('draft/:draftId/attachments/:attachmentId/image')
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'Read a private report image for an accessible draft' })
  @ApiOkResponse({ description: 'Private report image stream' })
  async readImage(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const image = await this.imageAssets.readDraftImage(
      request.user,
      draftId,
      attachmentId,
    );
    response.set({
      'Cache-Control': 'private, no-store',
      'Content-Type': image.mimeType,
      'Content-Disposition': `inline; filename="${image.filename.replace(/"/g, '')}"`,
    });
    return new StreamableFile(image.buffer, {
      type: image.mimeType,
      disposition: `inline; filename="${image.filename.replace(/"/g, '')}"`,
    });
  }

  @Delete('draft/:draftId/attachments/:attachmentId')
  @HttpCode(200)
  @AuthReportWorkflowParticipant()
  @ApiOperation({ summary: 'Delete a private report draft attachment' })
  @ApiOkResponse({ description: 'Updated report draft after attachment removal' })
  async deleteAttachment(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.imageAssets.deleteDraftAttachment(
      request.user,
      draftId,
      attachmentId,
    );
  }
}
