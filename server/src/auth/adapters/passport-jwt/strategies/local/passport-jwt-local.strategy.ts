import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { Request } from 'express';
import { LoginWithPasswordCommand } from '../../../../application/commands/login-with-password.command';
import type { AuthenticatedSession } from '../../../../application/models/authenticated-session';

@Injectable()
export class PassportJwtLocalStrategy extends PassportStrategy(
  Strategy,
  'local',
) {
  constructor(
    private readonly loginWithPassword: LoginWithPasswordCommand,
  ) {
    super({ usernameField: 'email', passwordField: 'password', passReqToCallback: true });
  }

  async validate(
    req: Request,
    email: string,
    password: string,
  ): Promise<AuthenticatedSession> {
    if (!email || !password) {
      throw new UnauthorizedException('Missing credentials');
    }

    const codeRaw = req?.body && typeof req.body.code === 'string' ? req.body.code : '';
    const code = codeRaw.replace(/\s/g, '');
    return this.loginWithPassword.execute({
      email: email.trim().toLowerCase(),
      password,
      code: code || undefined,
    });
  }
}
