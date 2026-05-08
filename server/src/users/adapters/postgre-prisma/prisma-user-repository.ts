import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../ports/user-repository.interface';
import { UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addUsername(user: CreateUserProfilePayload): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.uid },
      create: { id: user.uid, username: user.username },
      update: { username: user.username },
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true },
    });
    if (!row) {
      return null;
    }
    return { uid: row.id, username: row.username };
  }
}
