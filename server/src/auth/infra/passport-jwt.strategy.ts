import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from 'jsonwebtoken';
import { AuthRepository } from '../ports/auth.repository';
import { Inject } from '@nestjs/common';

type SupportedJwtPayload = JwtPayload & {
  uid?: string;
  user_id?: string;
  sub?: string;
  email?: string;
};

@Injectable()
export class PassportJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: SupportedJwtPayload) {
    const uid = payload.uid || payload.user_id || payload.sub;
    if (!uid) {
      throw new UnauthorizedException('JWT token does not contain a user id');
    }
    return this.authRepository.getUserByUid(uid);
  }
}
