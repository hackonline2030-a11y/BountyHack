import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { AuthResponse } from '../dto/auth-common.dto';
import { LoginWithPasswordCommand } from '../application/commands/login-with-password.command';

@Injectable()
export class PassportJwtLocalStrategy extends PassportStrategy(
  Strategy,
  'local',
) {
  constructor(
    private readonly loginWithPassword: LoginWithPasswordCommand,
  ) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      throw new UnauthorizedException('Missing credentials');
    }

    return this.loginWithPassword.execute({
      email: email.trim().toLowerCase(),
      password,
    });
  }
}
