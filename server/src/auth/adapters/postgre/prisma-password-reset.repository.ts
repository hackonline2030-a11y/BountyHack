import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import { hashOpaqueRefreshRaw } from '../utils/opaque-refresh-token.util';
import type {
  IPasswordResetRepository,
  PasswordResetAccountSnapshot,
} from '../../ports/password-reset.repository';

@Injectable()
export class PrismaPasswordResetRepository implements IPasswordResetRepository {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async findPasswordAccountByEmail(
    email: string,
  ): Promise<PasswordResetAccountSnapshot | null> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const row = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, passwordHash: true },
    });
    if (!row?.passwordHash || !row.email) {
      return null;
    }
    return {
      userId: row.id,
      username: row.username,
      email: row.email,
    };
  }

  async savePendingResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.create({
        data: {
          id: randomUUID(),
          tokenHash,
          userId,
          expiresAt,
        },
      });
    });
  }

  async consumePendingTokenAndApplyNewPassword(
    rawToken: string,
    newPasswordHash: string,
  ): Promise<void> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const trimmed = rawToken.trim();
    if (!trimmed) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
    const tokenHash = hashOpaqueRefreshRaw(trimmed);
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
      });
      if (!row || row.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException(
          'Invalid or expired password reset token',
        );
      }
      const userId = row.userId;
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });
      await tx.refreshToken.deleteMany({ where: { userId } });
    });
  }
}
