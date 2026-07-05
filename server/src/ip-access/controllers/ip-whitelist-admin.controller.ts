import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthRoles } from '../../auth/rbac/roles.decorator';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import {
  ApiHttpForbidden,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import { toIpAccessActor } from '../adapters/http/map-ip-access-actor';
import { AddIpWhitelistEntryCommand } from '../application/commands/add-ip-whitelist-entry.command';
import { RemoveIpWhitelistEntryCommand } from '../application/commands/remove-ip-whitelist-entry.command';
import { SetIpWhitelistEnabledCommand } from '../application/commands/set-ip-whitelist-enabled.command';
import { ListIpWhitelistEntriesQuery } from '../application/queries/list-ip-whitelist-entries.query';
import {
  CreateIpWhitelistEntryDto,
  SetIpWhitelistEnabledDto,
} from '../dto/ip-access.dto';

@ApiTags('ip-access-admin')
@ApiBearerAuth()
@Controller('ip-access/admin')
export class IpWhitelistAdminController {
  constructor(
    private readonly listWhitelist: ListIpWhitelistEntriesQuery,
    private readonly addEntry: AddIpWhitelistEntryCommand,
    private readonly removeEntry: RemoveIpWhitelistEntryCommand,
    private readonly setEnabled: SetIpWhitelistEnabledCommand,
  ) {}

  @Get('whitelist')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List IP whitelist entries and settings',
    description: 'SUPER_ADMIN only. CIDR values are always returned in canonical form.',
  })
  @ApiOkResponse({ description: 'Whitelist settings and entries.' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Authenticated user is not SUPER_ADMIN.')
  list() {
    return this.listWhitelist.execute();
  }

  @Post('whitelist')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Add an IP or CIDR to the whitelist',
    description:
      'SUPER_ADMIN only. Input is normalized before insert (e.g. 203.0.113.10 → 203.0.113.10/32).',
  })
  @ApiOkResponse({ description: 'Created whitelist entry.' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Authenticated user is not SUPER_ADMIN.')
  create(
    @Req() req: RequestWithIdentity,
    @Body() body: CreateIpWhitelistEntryDto,
  ) {
    return this.addEntry.execute(toIpAccessActor(req.user), body);
  }

  @Delete('whitelist/:entryId')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a whitelist entry (SUPER_ADMIN)' })
  @ApiOkResponse({ description: 'Entry removed.' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Authenticated user is not SUPER_ADMIN.')
  async remove(
    @Req() req: RequestWithIdentity,
    @Param('entryId') entryId: string,
  ) {
    await this.removeEntry.execute(toIpAccessActor(req.user), entryId);
    return { ok: true as const };
  }

  @Put('whitelist/enabled')
  @AuthRoles(AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Enable or disable IP whitelist mode',
    description:
      'When enabled, only whitelisted CIDRs can reach the API (except /ping and /docs).',
  })
  @ApiOkResponse({ description: 'Updated settings.' })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpForbidden('Authenticated user is not SUPER_ADMIN.')
  setWhitelistEnabled(
    @Req() req: RequestWithIdentity,
    @Body() body: SetIpWhitelistEnabledDto,
  ) {
    return this.setEnabled.execute(toIpAccessActor(req.user), body.enabled);
  }
}
