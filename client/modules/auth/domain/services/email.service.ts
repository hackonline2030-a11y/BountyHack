import type { User } from "@modules/auth/domain/entities/user.entity";
import type { Email } from "@modules/auth/domain/entities/user.entity";

export interface EmailService {
    sendWelcomeEmail(user: User): Promise<void>;
    sendPasswordReset(email: Email, token: string): Promise<void>;
  }