import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedSession } from '../models/authenticated-session';
import type { LoginWithPasswordInput } from '../models/login-with-password.input';
import { AuthRepository } from '../../ports/auth.repository';

@Injectable()
export class LoginWithPasswordCommand {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  execute(input: LoginWithPasswordInput): Promise<AuthenticatedSession> {
    return this.authRepository.login(input);
  }
}
