import { Controller, Get } from '@nestjs/common';
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
import { ListReportDraftsForFinalValidationQuery } from '../application/queries/list-report-drafts-for-final-validation.query';

@ApiTags('report-drafts-admin')
@ApiBearerAuth()
@Controller('report-drafts/admin')
export class ReportDraftAdminController {
  constructor(
    private readonly listForFinalValidation: ListReportDraftsForFinalValidationQuery,
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
}
