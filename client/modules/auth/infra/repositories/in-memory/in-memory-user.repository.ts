import type { UserRepository } from "@modules/auth/domain/repositories/user.repository";
import type { User, UserId, Email } from "@modules/auth/domain/entities/user.entity";

// Simple in-memory repository for tests.
export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, User>();
  private readonly userIdByEmail = new Map<string, string>();

  async findById(id: UserId): Promise<User | null> {
    return this.usersById.get(id.value) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userId = this.userIdByEmail.get(email.value);
    if (!userId) return null;
    return this.usersById.get(userId) ?? null;
  }

  async save(user: User): Promise<void> {
    this.usersById.set(user.id.value, user);
    this.userIdByEmail.set(user.email.value, user.id.value);
  }
}

