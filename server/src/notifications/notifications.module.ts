import { Module } from '@nestjs/common';
import { CommonModule } from '../core/common.module';
import {
  I_NOTIFICATION_REPOSITORY,
} from './ports/notification-repository.interface';
import { PrismaNotificationRepository } from './adapters/postgre-prisma/prisma-notification-repository';
import { CreateUserEventCommand } from './application/commands/create-user-event.command';
import { DeleteUserEventCommand } from './application/commands/delete-user-event.command';
import { ListUserEventsQuery } from './application/queries/list-user-events.query';
import { NotificationsController } from './controllers/notifications.controller';

@Module({
  imports: [CommonModule],
  controllers: [NotificationsController],
  providers: [
    {
      provide: I_NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    CreateUserEventCommand,
    DeleteUserEventCommand,
    ListUserEventsQuery,
  ],
  exports: [CreateUserEventCommand, I_NOTIFICATION_REPOSITORY],
})
export class NotificationsModule {}
