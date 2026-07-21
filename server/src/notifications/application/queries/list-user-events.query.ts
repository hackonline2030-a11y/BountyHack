import { Inject, Injectable } from '@nestjs/common';
import {
  I_NOTIFICATION_REPOSITORY,
  INotificationRepository,
} from '../../ports/notification-repository.interface';
import type { UserEventWire } from '../../models/notification-api.types';

@Injectable()
export class ListUserEventsQuery {
  constructor(
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(roleCode: string): Promise<UserEventWire[]> {
    return this.notificationRepository.findByTargetRole(roleCode);
  }
}
