import type {
  CreateUserEventInput,
  UserEventWire,
} from '../models/notification-api.types';

export interface INotificationRepository {
  create(input: CreateUserEventInput): Promise<UserEventWire>;
  findByTargetRole(roleCode: string): Promise<UserEventWire[]>;
  delete(eventId: string): Promise<void>;
}

export const I_NOTIFICATION_REPOSITORY = Symbol('I_NOTIFICATION_REPOSITORY');
