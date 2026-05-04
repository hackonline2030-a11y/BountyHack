import type { UserRepository } from "@modules/auth/domain/repositories/user.repository";
import type { EmailService } from "@modules/auth/domain/services/email.service";
import type { PasswordHasher } from "@modules/auth/domain/services/password-hasher.service";
import { Email, User, UserProfile } from "@modules/auth/domain/entities/user.entity";
import { UserAlreadyExistsError } from "@modules/auth/domain/errors/errors.entity";
import type { RegisterUserInput, RegisterUserOutput } from "./register-user.types";

export class RegisterUserUseCase {
    constructor(
      private userRepo: UserRepository,
      private emailService: EmailService,
      private passwordHasher: PasswordHasher
    ) {}
  
    async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
      // 1. Create value objects
      const email = Email.create(input.email);
      const hashedPassword = await this.passwordHasher.hash(input.password);
  
      // 2. Check business rules
      const existing = await this.userRepo.findByEmail(email);
      if (existing) {
        throw new UserAlreadyExistsError(email);
      }
  
      // 3. Create entity
      const user = User.create({
        email,
        password: hashedPassword,
        profile: UserProfile.create({ name: input.name }),
      });
  
      // 4. Persist
      await this.userRepo.save(user);
  
      // 5. Side effects
      await this.emailService.sendWelcomeEmail(user);
  
      return {
        userId: user.id.value,
        success: true,
      };
    }
  }