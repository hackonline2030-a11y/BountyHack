import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedSession } from '../models/authenticated-session';
import type { RegisterWithPasswordInput } from '../models/register-with-password.input';
import { AuthRepository } from '../../ports/auth.repository';

@Injectable()
export class RegisterWithPasswordCommand {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  execute(input: RegisterWithPasswordInput): Promise<AuthenticatedSession> {
    return this.authRepository.register(input);
  }
}
