import type { UserRepository } from "@modules/auth/domain/repositories/user.repository";
import type { Email, User, UserId } from "@modules/auth/domain/entities/user.entity";
import { UserMapper } from "@modules/auth/infra/mappers/user.mapper";
import type { PrismaClient } from "@/generated/prisma/client";

export class PrismaUserRepository implements UserRepository {
    constructor(private readonly prisma: PrismaClient) {}
  
    async findById(id: UserId): Promise<User | null> {
      const record = await this.prisma.user.findUnique({
        where: { id: id.value },
      });
      return record ? UserMapper.toDomain(record) : null;
    }
  
    async save(user: User): Promise<void> {
      const data = UserMapper.toPersistence(user);
      await this.prisma.user.upsert({
        where: { id: data.id },
        update: data,
        create: data,
      });
    }

    async findByEmail(email: Email): Promise<User | null> {
      const record = await this.prisma.user.findUnique({
        where: { email: email.value },
      });
      return record ? UserMapper.toDomain(record) : null;
    }
  }