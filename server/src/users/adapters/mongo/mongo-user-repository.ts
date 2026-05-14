import { Model } from 'mongoose';
import { IUserRepository } from '../../ports/user-repository.interface';
import { MongoUser } from './mongo-user';
import { UserAdminSummary, UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
import { HttpException, HttpStatus, Inject, NotImplementedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';

export class MongoUserRepository implements IUserRepository {
  constructor(
    @Inject(getModelToken(MongoUser.CollectionName)) private readonly model: Model<MongoUser.SchemaClass>,
  ) {}

  async addUsername(user: CreateUserProfilePayload): Promise<void> {
    const data = {
      _id: user.uid,
      username: user.username,
    }
    const record = new this.model(data);
    await record.save();
  }

  async findById(id: string): Promise<UserRecord | null> {
    console.log(id)
    const record = await this.model.findById(id);
    console.log(record)
    if (!record) {
      throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
    }

    return { uid: String(record._id), username: record.username };
  }

  /**
   * The admin listing surface is intentionally Postgres-Prisma only at this stage —
   * Mongo does not yet carry RBAC role rows. Surface a 501 if a Mongo deployment
   * ever lands on this endpoint so the caller cannot silently get an empty list.
   */
  async listAdminSummaries(): Promise<UserAdminSummary[]> {
    throw new NotImplementedException(
      'Admin user listing is not implemented on the Mongo adapter yet.',
    );
  }
}
