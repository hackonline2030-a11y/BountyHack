import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type { INotificationRepository } from '../../ports/notification-repository.interface';
import type {
  CreateUserEventInput,
  UserEventWire,
} from '../../models/notification-api.types';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserEventInput): Promise<UserEventWire> {
    const row = await this.prisma.userEvent.create({
      data: {
        userId: input.userId,
        eventType: input.eventType,
        oldValue: input.oldValue,
        newValue: input.newValue,
      },
      include: { user: true },
    });
    return this.toWire(row);
  }

  async findByTargetRole(_roleCode: string): Promise<UserEventWire[]> {
    // Events are visible to both COORDINATOR and SUPER_ADMIN roles.
    // Filtering by role-specific scope can be added later; for now expose all profile events.
    const rows = await this.prisma.userEvent.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
    return rows.map((row) => this.toWire(row));
  }

  async delete(eventId: string): Promise<void> {
    await this.prisma.userEvent.delete({
      where: { id: eventId },
    });
  }

  private toWire(row: any): UserEventWire {
    return {
      id: row.id,
      userId: row.userId,
      userDisplayName: row.user?.username ?? row.userId,
      eventType: row.eventType,
      oldValue: row.oldValue ?? undefined,
      newValue: row.newValue ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
