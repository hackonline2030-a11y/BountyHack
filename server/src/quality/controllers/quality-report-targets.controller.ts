import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { AuthQualityCriteriaManager } from '../../shared/rbac/quality-auth.decorator';
import { ListQualityReportDraftTargetsQuery } from '../application/queries/list-quality-report-draft-targets.query';

@ApiTags('quality')
@ApiBearerAuth()
@Controller('quality/report-draft-targets')
export class QualityReportTargetsController {
  constructor(
    private readonly listReportDraftTargets: ListQualityReportDraftTargetsQuery,
  ) {}

  @Get()
  @AuthQualityCriteriaManager()
  @ApiOperation({
    summary:
      'List report drafts the QC may target when distributing criteria (team-scoped)',
  })
  list(@Req() req: RequestWithIdentity) {
    return this.listReportDraftTargets.execute(req.user);
  }
}
