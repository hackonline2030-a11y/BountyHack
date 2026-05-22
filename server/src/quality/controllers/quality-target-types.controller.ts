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
  AuthQualityCriteriaManager,
  AuthQualityCriteriaReader,
} from '../../shared/rbac/quality-auth.decorator';
import { ManageQualityTargetTypesCommand } from '../application/commands/manage-quality-target-types.command';
import {
  CreateQualityTargetTypeDto,
  UpdateQualityTargetTypeDto,
} from '../dto/quality.dto';

@ApiTags('quality')
@ApiBearerAuth()
@Controller('quality/target-types')
export class QualityTargetTypesController {
  constructor(private readonly targetTypes: ManageQualityTargetTypesCommand) {}

  @Get()
  @AuthQualityCriteriaReader()
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiOperation({ summary: 'List distributable target object types' })
  list(@Query('activeOnly') activeOnly?: string) {
    return this.targetTypes.list(activeOnly === 'true');
  }

  @Post()
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Register a new target type' })
  create(
    @Req() req: RequestWithIdentity,
    @Body() body: CreateQualityTargetTypeDto,
  ) {
    return this.targetTypes.create(req.user, body);
  }

  @Patch(':targetTypeId')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Update target type metadata' })
  update(
    @Req() req: RequestWithIdentity,
    @Param('targetTypeId') targetTypeId: string,
    @Body() body: UpdateQualityTargetTypeDto,
  ) {
    return this.targetTypes.update(req.user, targetTypeId, body);
  }

  @Delete(':targetTypeId')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Delete unused target type' })
  async remove(
    @Req() req: RequestWithIdentity,
    @Param('targetTypeId') targetTypeId: string,
  ) {
    await this.targetTypes.delete(req.user, targetTypeId);
    return { ok: true };
  }
}
