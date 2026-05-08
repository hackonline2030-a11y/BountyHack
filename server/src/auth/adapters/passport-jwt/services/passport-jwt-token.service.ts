import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { Identity } from '../../../domain/models/identity';

type SupportedJwtPayload = JwtPayload & {
  uid?: string;
  user_id?: string;
  sub?: string;
  email?: string;
};

@Injectable()
export class PassportJwtTokenService {
  getUserFromToken(token: string): Identity {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }

    const payload = verify(token, secret) as SupportedJwtPayload;
    const uid = payload.uid || payload.user_id || payload.sub;
    if (!uid) {
      throw new UnauthorizedException('JWT token does not contain a user id');
    }

    return {
      email: payload.email ?? '',
      uid,
    };
  }

  signToken(uid: string, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    return sign({ user_id: uid, email, sub: uid }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }
}
