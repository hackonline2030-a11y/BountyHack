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
import { ManageQualityCategoriesCommand } from '../application/commands/manage-quality-categories.command';
import {
  CreateQualityCategoryDto,
  UpdateQualityCategoryDto,
} from '../dto/quality.dto';

@ApiTags('quality')
@ApiBearerAuth()
@Controller('quality/categories')
export class QualityCategoriesController {
  constructor(private readonly categories: ManageQualityCategoriesCommand) {}

  @Get()
  @AuthQualityCriteriaReader()
  @ApiOperation({ summary: 'List quality criterion categories' })
  list() {
    return this.categories.list();
  }

  @Post()
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Create category (quality checker)' })
  create(
    @Req() req: RequestWithIdentity,
    @Body() body: CreateQualityCategoryDto,
  ) {
    return this.categories.create(req.user, body);
  }

  @Patch(':categoryId')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Update category' })
  update(
    @Req() req: RequestWithIdentity,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateQualityCategoryDto,
  ) {
    return this.categories.update(req.user, categoryId, body);
  }

  @Delete(':categoryId')
  @AuthQualityCriteriaManager()
  @ApiOperation({ summary: 'Delete category (criteria become unclassified)' })
  async remove(
    @Req() req: RequestWithIdentity,
    @Param('categoryId') categoryId: string,
  ) {
    await this.categories.delete(req.user, categoryId);
    return { ok: true };
  }
}
