import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import {
  AuthQualityCriteriaManager,
  AuthQualityCriteriaReader,
} from '../../shared/rbac/quality-auth.decorator';
import { ManageQualityCriteriaCommand } from '../application/commands/manage-quality-criteria.command';
import {
  CreateQualityCriterionDto,
  UpdateQualityCriterionDto,
} from '../dto/quality.dto';

@ApiTags('quality')
@ApiBearerAuth()
@Controller('quality/criteria')
export class QualityCriteriaController {
  constructor(private readonly criteria: ManageQualityCriteriaCommand) {}

  @Get('mine/drafts')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'List draft criteria created by the caller (QC)' })
  listMyDrafts(@Req() req: RequestWithIdentity) {
    return this.criteria.listMyDrafts(req.user);
  }

  @Get('published')
  @AuthQualityCriteriaReader()
  @ApiOperation({ summary: 'Published criteria catalog (authenticated readers)' })
  listPublished(@Req() req: RequestWithIdentity) {
    return this.criteria.listPublished(req.user);
  }

  @Get(':criterionId')
  @AuthQualityCriteriaReader()
  @ApiOperation({ summary: 'Get one criterion' })
  getOne(
    @Req() req: RequestWithIdentity,
    @Param('criterionId') criterionId: string,
  ) {
    return this.criteria.getById(req.user, criterionId);
  }

  @Post()
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Create draft criterion' })
  create(
    @Req() req: RequestWithIdentity,
    @Body() body: CreateQualityCriterionDto,
  ) {
    return this.criteria.create(req.user, body);
  }

  @Patch(':criterionId')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Update criterion' })
  update(
    @Req() req: RequestWithIdentity,
    @Param('criterionId') criterionId: string,
    @Body() body: UpdateQualityCriterionDto,
  ) {
    return this.criteria.update(req.user, criterionId, body);
  }

  @Delete(':criterionId')
  @AuthQualityCriteriaManager()
  @ApiOperation({
    summary: 'Delete criterion (cascades distributions and checks)',
  })
  async remove(
    @Req() req: RequestWithIdentity,
    @Param('criterionId') criterionId: string,
  ) {
    await this.criteria.delete(req.user, criterionId);
    return { ok: true };
  }

  @Post(':criterionId/publish')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Publish criterion to the shared catalog' })
  publish(
    @Req() req: RequestWithIdentity,
    @Param('criterionId') criterionId: string,
  ) {
    return this.criteria.publish(req.user, criterionId);
  }

  @Post(':criterionId/archive')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Archive criterion (hidden from new distributions)' })
  archive(
    @Req() req: RequestWithIdentity,
    @Param('criterionId') criterionId: string,
  ) {
    return this.criteria.archive(req.user, criterionId);
  }
}
