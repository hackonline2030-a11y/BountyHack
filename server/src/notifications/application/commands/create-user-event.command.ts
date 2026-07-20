import { Inject, Injectable } from '@nestjs/common';
import {
  I_NOTIFICATION_REPOSITORY,
  INotificationRepository,
} from '../../ports/notification-repository.interface';
import type {
  CreateUserEventInput,
  UserEventWire,
} from '../../models/notification-api.types';

@Injectable()
export class CreateUserEventCommand {
  constructor(
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: CreateUserEventInput): Promise<UserEventWire> {
    return this.notificationRepository.create(input);
  }
}
