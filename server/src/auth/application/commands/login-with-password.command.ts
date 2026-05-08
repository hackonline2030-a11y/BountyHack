import { Inject, Injectable } from '@nestjs/common';
import { LoginDto, AuthResponse } from '../../dto/auth-common.dto';
import { AuthRepository } from '../../ports/auth.repository';

@Injectable()
export class LoginWithPasswordCommand {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  execute(input: LoginDto): Promise<AuthResponse> {
    return this.authRepository.login(input);
  }
}
