import { Inject, Injectable } from '@nestjs/common';
import {
  I_NOTIFICATION_REPOSITORY,
  INotificationRepository,
} from '../../ports/notification-repository.interface';

@Injectable()
export class DeleteUserEventCommand {
  constructor(
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(eventId: string): Promise<void> {
    return this.notificationRepository.delete(eventId);
  }
}
