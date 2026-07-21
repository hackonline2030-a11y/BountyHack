import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Auth } from '../../auth/auth.decorator';
import { AuthRoles } from '../../auth/rbac/roles.decorator';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { Identity } from '../../auth/domain/models/identity';
import { ListUserEventsQuery } from '../application/queries/list-user-events.query';
import { DeleteUserEventCommand } from '../application/commands/delete-user-event.command';
import { UserEventListResponseDto, UserEventResponseDto } from '../dto/notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly listUserEventsQuery: ListUserEventsQuery,
    private readonly deleteUserEventCommand: DeleteUserEventCommand,
  ) {}

  @Get('user-events')
  @AuthRoles(AppRoleCode.COORDINATOR, AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List user profile change events',
    description:
      'Returns all user profile change events for coordinator and super-admin dashboards.',
  })
  @ApiOkResponse({
    description: 'User events returned.',
    type: UserEventListResponseDto,
  })
  async list(@Req() request: RequestWithIdentity): Promise<UserEventListResponseDto> {
    const identity = this.getAuthenticatedIdentity(request);
    const events = await this.listUserEventsQuery.execute(
      identity.roleCode ?? AppRoleCode.COORDINATOR,
    );
    return plainToInstance(
      UserEventListResponseDto,
      {
        items: events.map((event) =>
          plainToInstance(UserEventResponseDto, event, {
            excludeExtraneousValues: true,
          }),
        ),
      },
      { excludeExtraneousValues: true },
    );
  }

  @Delete('user-events/:eventId')
  @AuthRoles(AppRoleCode.COORDINATOR, AppRoleCode.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete a user profile change event',
    description:
      'Allows coordinator or super-admin to remove an event from their dashboard.',
  })
  @ApiOkResponse({
    description: 'Event deleted.',
  })
  async delete(@Param('eventId') eventId: string): Promise<{ ok: true }> {
    await this.deleteUserEventCommand.execute(eventId);
    return { ok: true };
  }

  private getAuthenticatedIdentity(request: RequestWithIdentity): Identity {
    const identity = request.user;
    if (!identity?.uid) {
      throw new ForbiddenException('Utilisateur non authentifie');
    }
    return identity;
  }
}
