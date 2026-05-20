import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthRoles } from '../../auth/rbac/roles.decorator';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import {
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import type { ReportDraftFinalValidationSummary } from '../models/report-draft-final-validation-summary.model';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { ListReportDraftsForFinalValidationQuery } from '../application/queries/list-report-drafts-for-final-validation.query';
import {
  SuperAdminFinalValidationService,
  type SuperAdminStepCommentInput,
} from '../application/admin/super-admin-final-validation.service';
import { DeleteReportDraftCommand } from '../application/commands/delete-report-draft.command';
import { ListAllReportDraftAttachmentsQuery } from '../application/queries/list-all-report-draft-attachments.query';
import { ReportDraftImageAssetService } from '../application/attachments/report-draft-image-asset.service';
import type { AdminReportDraftAttachmentRowWire } from '../models/report-draft-attachment-admin.types';
import type { ReportDraftWire, ReviewerCommentWire } from '../models/report-draft-api.types';

@ApiTags('report-drafts-admin')
@ApiBearerAuth()
@Controller('report-drafts/admin')
export class ReportDraftAdminController {
  constructor(
    private readonly listForFinalValidation: ListReportDraftsForFinalValidationQuery,
    private readonly superAdminFinalValidation: SuperAdminFinalValidationService,
    private readonly deleteReportDraft: DeleteReportDraftCommand,
    private readonly listAllAttachmentsQuery: ListAllReportDraftAttachmentsQuery,
    private readonly imageAssets: ReportDraftImageAssetService,
  ) {}

  @Get('final-validation-queue')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all report drafts for super-admin final validation',
    description:
      'Returns every report draft (newest first). UI defaults to filtering `ready-to-program`. SUPER_ADMIN only.',
  })
  @ApiOkResponse({ description: 'Validation queue rows' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Authenticated user is not SUPER_ADMIN.')
  @ApiHttpInternalServerError('Unexpected error while listing validation queue.')
  async listFinalValidationQueue(): Promise<ReportDraftFinalValidationSummary[]> {
    return this.listForFinalValidation.execute();
  }

  @Delete('drafts/:draftId')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Permanently delete a report draft and all related data',
    description:
      'Removes the draft, its team (cascade), steps, submissions, global submissions, and comments. Irreversible. SUPER_ADMIN only.',
  })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Authenticated user is not SUPER_ADMIN.')
  @ApiHttpInternalServerError('Unexpected error while deleting report draft.')
  async deleteDraft(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
  ): Promise<{ ok: true }> {
    await this.deleteReportDraft.execute(request.user, draftId);
    return { ok: true };
  }

  @Post('drafts/:draftId/final-validate')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve final validation and publish draft' })
  @ApiOkResponse({ description: 'Updated report draft' })
  async approveFinalValidation(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
  ): Promise<ReportDraftWire> {
    return this.superAdminFinalValidation.approveFinalValidation(
      request.user,
      draftId,
    );
  }

  @Post('drafts/:draftId/request-final-revision')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Request a global revision from the whole report team',
  })
  @ApiOkResponse({ description: 'Updated report draft' })
  async requestFinalRevision(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
  ): Promise<ReportDraftWire> {
    return this.superAdminFinalValidation.requestFinalRevision(
      request.user,
      draftId,
    );
  }

  @Post('drafts/:draftId/super-admin-comments')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Save super-admin general comments per wizard step' })
  @ApiOkResponse({ description: 'Saved comments' })
  async saveSuperAdminComments(
    @Req() request: RequestWithIdentity,
    @Param('draftId') draftId: string,
    @Body() body: { comments: SuperAdminStepCommentInput[] },
  ): Promise<ReviewerCommentWire[]> {
    return this.superAdminFinalValidation.saveStepComments(
      request.user,
      draftId,
      body.comments ?? [],
    );
  }

  @Get('attachments')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all report draft attachments (super-admin)' })
  @ApiOkResponse({ description: 'Attachment inventory rows' })
  async listAllAttachments(): Promise<AdminReportDraftAttachmentRowWire[]> {
    return this.listAllAttachmentsQuery.execute();
  }

  @Delete('attachments/:attachmentId')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a report draft attachment (super-admin)' })
  @ApiOkResponse({ description: 'Updated report draft' })
  async deleteAttachment(
    @Req() request: RequestWithIdentity,
    @Param('attachmentId') attachmentId: string,
  ): Promise<ReportDraftWire> {
    const row = await this.imageAssets.findAttachmentDraftId(attachmentId);
    return this.imageAssets.deleteDraftAttachment(
      request.user,
      row.draftId,
      attachmentId,
    );
  }
}
