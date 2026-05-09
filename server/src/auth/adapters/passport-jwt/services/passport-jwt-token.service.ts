import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, JsonWebTokenError, sign, verify, TokenExpiredError } from 'jsonwebtoken';
import { Identity } from '../../../domain/models/identity';

type SupportedAccessPayload = JwtPayload & {
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

    let payload: SupportedAccessPayload;
    try {
      payload = verify(token, secret) as SupportedAccessPayload;
    } catch (e) {
      this.rethrowJwtError(e);
    }

    const uid = payload.uid || payload.user_id || payload.sub;
    if (!uid) {
      throw new UnauthorizedException('JWT token does not contain a user id');
    }

    return {
      email: typeof payload.email === 'string' ? payload.email : '',
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

  private rethrowJwtError(e: unknown): never {
    if (e instanceof TokenExpiredError) {
      throw new UnauthorizedException('Token expired');
    }
    if (e instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid token');
    }
    throw e;
  }
}
