import { Inject, Injectable } from '@nestjs/common';
import { Identity } from '../../domain/models/identity';
import { AuthRepository } from '../../ports/auth.repository';

@Injectable()
export class GetUserByUidQuery {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  execute(uid: string): Promise<Identity> {
    return this.authRepository.getUserByUid(uid);
  }
}
