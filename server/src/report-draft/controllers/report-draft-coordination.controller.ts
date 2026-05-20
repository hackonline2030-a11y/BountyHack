import { Controller, Get, Req } from '@nestjs/common';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
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
import { ListHuntersForCoordinatorQuery } from '../application/queries/list-hunters-for-coordinator.query';
import type { UserAdminSummary } from '../../users/models';

@ApiTags('report-drafts-coordination')
@ApiBearerAuth()
@Controller('report-drafts/coordination')
export class ReportDraftCoordinationController {
  constructor(
    private readonly listOrphanReportDrafts: ListOrphanReportDraftsQuery,
    private readonly listHuntersForCoordinator: ListHuntersForCoordinatorQuery,
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

  @Get('hunters')
  @AuthCoordinatorOrSuperAdmin()
  @ApiOperation({
    summary: 'List all users with the hunter role (coordinator picker)',
  })
  @ApiOkResponse({ description: 'Hunter user summaries' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Coordinator or super admin required.')
  @ApiHttpInternalServerError('Unexpected error while listing hunters.')
  async listHunters(@Req() request: RequestWithIdentity): Promise<UserAdminSummary[]> {
    return this.listHuntersForCoordinator.execute(request.user);
  }
}
