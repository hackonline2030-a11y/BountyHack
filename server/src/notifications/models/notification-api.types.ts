export type UserEventTypeWire =
  | 'username_changed'
  | 'email_changed'
  | 'password_changed';

export interface UserEventWire {
  id: string;
  userId: string;
  userDisplayName: string;
  eventType: UserEventTypeWire;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface CreateUserEventInput {
  userId: string;
  userDisplayName: string;
  eventType: UserEventTypeWire;
  oldValue?: string;
  newValue?: string;
}
