import { Inject, Injectable } from '@nestjs/common';
import { RegisterDto, AuthResponse } from '../../dto/auth-common.dto';
import { AuthRepository } from '../../ports/auth.repository';

@Injectable()
export class RegisterWithPasswordCommand {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  execute(input: RegisterDto): Promise<AuthResponse> {
    return this.authRepository.register(input);
  }
}
