import type { EmailService } from "@modules/auth/domain/services/email.service";
import type { Email, User } from "@modules/auth/domain/entities/user.entity";

// Infra placeholder: currently no external email provider dependency.
// Later you can replace internals with `resend` (or any provider) without
// changing the domain/use-case layer.
export class ResendEmailService implements EmailService {
  constructor(private readonly _apiKey: string) {}

  async sendWelcomeEmail(_user: User): Promise<void> {
    // no-op for now
  }

  async sendPasswordReset(_email: Email, _token: string): Promise<void> {
    // no-op for now
  }
}