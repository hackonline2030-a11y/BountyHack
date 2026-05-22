import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import {
  AuthQualityCriteriaChecker,
  AuthQualityCriteriaManager,
  AuthQualityCriteriaReader,
} from '../../shared/rbac/quality-auth.decorator';
import { ManageQualityDistributionsCommand } from '../application/commands/manage-quality-distributions.command';
import { UpsertQualityCheckCommand } from '../application/commands/upsert-quality-check.command';
import {
  CreateQualityDistributionDto,
  UpdateQualityDistributionDto,
  UpsertQualityCheckDto,
} from '../dto/quality.dto';

@ApiTags('quality')
@ApiBearerAuth()
@Controller('quality/instances')
export class QualityInstancesController {
  constructor(
    private readonly distributions: ManageQualityDistributionsCommand,
    private readonly upsertCheck: UpsertQualityCheckCommand,
  ) {}

  @Get(':targetTypeCode/criteria')
  @AuthQualityCriteriaReader()
  @ApiQuery({
    name: 'targetRefId',
    required: false,
    description: 'Omit for global targets (e.g. path_course)',
  })
  @ApiQuery({
    name: 'context',
    required: false,
    description: 'Filter checks to one review context',
  })
  @ApiOperation({
    summary:
      'List distributed criteria for a target instance (checkboxes only after QC distribution)',
  })
  listForInstance(
    @Req() req: RequestWithIdentity,
    @Param('targetTypeCode') targetTypeCode: string,
    @Query('targetRefId') targetRefId?: string,
    @Query('context') context?: string,
  ) {
    return this.distributions.listForInstance(
      req.user,
      targetTypeCode,
      targetRefId ?? null,
      context,
    );
  }

  @Post('distributions')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Distribute a published criterion to a target' })
  createDistribution(
    @Req() req: RequestWithIdentity,
    @Body() body: CreateQualityDistributionDto,
  ) {
    return this.distributions.create(req.user, body);
  }

  @Patch('distributions/:distributionId')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Update distribution (e.g. move report target ref)' })
  updateDistribution(
    @Req() req: RequestWithIdentity,
    @Param('distributionId') distributionId: string,
    @Body() body: UpdateQualityDistributionDto,
  ) {
    return this.distributions.update(req.user, distributionId, body);
  }

  @Delete('distributions/:distributionId')
  @AuthQualityCriteriaManager()
  @ApiOperation({
    summary: 'Revoke distribution (removes checkboxes; cascades checks)',
  })
  async deleteDistribution(
    @Req() req: RequestWithIdentity,
    @Param('distributionId') distributionId: string,
  ) {
    await this.distributions.delete(req.user, distributionId);
    return { ok: true };
  }

  @Patch('distributions/:distributionId/check')
  @AuthQualityCriteriaChecker()
  @ApiOperation({
    summary: 'Toggle criterion check (mentor or quality checker on target)',
  })
  patchCheck(
    @Req() req: RequestWithIdentity,
    @Param('distributionId') distributionId: string,
    @Body() body: UpsertQualityCheckDto,
  ) {
    return this.upsertCheck.execute(
      req.user,
      distributionId,
      body.context,
      body.checked,
    );
  }
}
