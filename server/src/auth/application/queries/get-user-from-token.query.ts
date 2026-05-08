import { Inject, Injectable } from '@nestjs/common';
import { Identity } from '../../domain/models/identity';
import { AuthRepository } from '../../ports/auth.repository';

@Injectable()
export class GetUserFromTokenQuery {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  execute(token: string): Promise<Identity> {
    return this.authRepository.getUserFromToken(token);
  }
}
