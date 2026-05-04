import type {
  EmailService,
} from "@modules/auth/domain/services/email.service";
import type { Email, User } from "@modules/auth/domain/entities/user.entity";

// Fake email service for tests. Captures calls without sending anything externally.
export class FakeEmailService implements EmailService {
  public readonly welcomeEmailsSent: string[] = [];
  public readonly passwordResetsSent: Array<{ email: string; token: string }> =
    [];

  async sendWelcomeEmail(user: User): Promise<void> {
    this.welcomeEmailsSent.push(user.email.value);
  }

  async sendPasswordReset(email: Email, token: string): Promise<void> {
    this.passwordResetsSent.push({ email: email.value, token });
  }
}

