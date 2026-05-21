import {
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../../core/infrastructure/database/prisma/prisma.service';
import type { IRefreshTokenRepository } from '../../../../ports/refresh-token.repository';
import { hashOpaqueRefreshRaw } from '../../../utils/opaque-refresh-token.util';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async store(
    userId: string,
    rawToken: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    await this.prisma.refreshToken.create({
      data: {
        id: randomUUID(),
        tokenHash: hashOpaqueRefreshRaw(rawToken),
        userId,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  async findValidForRotation(
    rawToken: string,
  ): Promise<{ userId: string } | null> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const hash = hashOpaqueRefreshRaw(rawToken);
    const row = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash: hash,
        expiresAt: { gte: new Date() },
      },
    });
    if (!row) {
      return null;
    }
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    });
    return { userId: row.userId };
  }

  async revokeByRawToken(rawToken: string): Promise<void> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash: hashOpaqueRefreshRaw(rawToken) },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
