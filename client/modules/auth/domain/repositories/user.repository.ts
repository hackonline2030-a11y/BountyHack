import type { UserId } from "@modules/auth/domain/entities/user.entity";
import type { User } from "@modules/auth/domain/entities/user.entity";
import type { Email } from "@modules/auth/domain/entities/user.entity";

export interface UserRepository {
    findById(id: UserId): Promise<User | null>;
    save(user: User): Promise<void>;
    findByEmail(email: Email): Promise<User | null>;
  }