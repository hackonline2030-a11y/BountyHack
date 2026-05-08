import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthRepository } from '../ports/auth.repository';
import type { AuthResponse } from '../dto/auth-common.dto';

@Injectable()
export class PassportJwtLocalStrategy extends PassportStrategy(
  Strategy,
  'local',
) {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      throw new UnauthorizedException('Missing credentials');
    }

    return this.authRepository.login({
      email: email.trim().toLowerCase(),
      password,
    });
  }
}
