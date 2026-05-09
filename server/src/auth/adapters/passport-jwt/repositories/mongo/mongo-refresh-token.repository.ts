import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IRefreshTokenRepository } from '../../../../ports/refresh-token.repository';
import { hashOpaqueRefreshRaw } from '../../../utils/opaque-refresh-token.util';
import { MongoRefreshToken } from './mongo-refresh-token';

@Injectable()
export class MongoRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @Optional()
    @Inject(getModelToken(MongoRefreshToken.CollectionName))
    private readonly model?: Model<MongoRefreshToken.SchemaClass>,
  ) {}

  async store(
    userId: string,
    rawToken: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!this.model) {
      throw new InternalServerErrorException(
        'Mongo refresh token model is not available',
      );
    }
    await this.model.create({
      tokenHash: hashOpaqueRefreshRaw(rawToken),
      userId,
      expiryDate: expiresAt,
      lastUsedAt: new Date(),
    });
  }

  async findValidForRotation(
    rawToken: string,
  ): Promise<{ userId: string } | null> {
    if (!this.model) {
      throw new InternalServerErrorException(
        'Mongo refresh token model is not available',
      );
    }
    const hash = hashOpaqueRefreshRaw(rawToken);
    const row = await this.model
      .findOne({
        tokenHash: hash,
        expiryDate: { $gte: new Date() },
      })
      .exec();
    if (!row) {
      return null;
    }
    row.lastUsedAt = new Date();
    await row.save();
    return { userId: row.userId };
  }

  async revokeByRawToken(rawToken: string): Promise<void> {
    if (!this.model) {
      throw new InternalServerErrorException(
        'Mongo refresh token model is not available',
      );
    }
    await this.model
      .deleteOne({ tokenHash: hashOpaqueRefreshRaw(rawToken) })
      .exec();
  }
}
