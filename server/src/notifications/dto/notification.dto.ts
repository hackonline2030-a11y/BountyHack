import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { UserEventTypeWire } from '../models/notification-api.types';

export class UserEventResponseDto {
  @ApiProperty({ description: 'Unique event id' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'User id who triggered the event' })
  @Expose()
  userId!: string;

  @ApiProperty({ description: 'Display name of the user at event creation' })
  @Expose()
  userDisplayName!: string;

  @ApiProperty({ description: 'Type of user profile event' })
  @Expose()
  eventType!: UserEventTypeWire;

  @ApiPropertyOptional({ description: 'Previous value' })
  @Expose()
  oldValue?: string;

  @ApiPropertyOptional({ description: 'New value' })
  @Expose()
  newValue?: string;

  @ApiProperty({ description: 'Event creation ISO timestamp' })
  @Expose()
  createdAt!: string;
}

export class UserEventListResponseDto {
  @ApiProperty({ type: [UserEventResponseDto] })
  @Expose()
  items!: UserEventResponseDto[];
}
