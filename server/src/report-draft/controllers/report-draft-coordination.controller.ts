import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthCoordinatorOrSuperAdmin } from '../../shared/rbac/report-workflow-auth.decorator';
import {
  ApiHttpForbidden,
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import type { ReportDraftOrphanSummary } from '../models/report-draft-orphan-summary.model';
import { ListOrphanReportDraftsQuery } from '../application/queries/list-orphan-report-drafts.query';

@ApiTags('report-drafts-coordination')
@ApiBearerAuth()
@Controller('report-drafts/coordination')
export class ReportDraftCoordinationController {
  constructor(
    private readonly listOrphanReportDrafts: ListOrphanReportDraftsQuery,
  ) {}

  @Get('orphan-drafts')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({
    summary: 'List report drafts without a report team',
    description:
      'Brouillons orphelins (équipe supprimée ou jamais créée). Le hunter reste propriétaire du brouillon.',
  })
  @ApiOkResponse({ description: 'Orphan draft rows' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while listing orphan drafts.')
  async listOrphanDrafts(): Promise<ReportDraftOrphanSummary[]> {
    return this.listOrphanReportDrafts.execute();
  }
}
