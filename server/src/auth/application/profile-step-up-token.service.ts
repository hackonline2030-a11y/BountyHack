import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, sign, TokenExpiredError, verify } from 'jsonwebtoken';

export const STEP_UP_PURPOSE_PROFILE_EDIT = 'profile-edit' as const;
export const STEP_UP_PURPOSE_ACCOUNT_DELETE = 'account-delete' as const;

export type StepUpPurpose =
  | typeof STEP_UP_PURPOSE_PROFILE_EDIT
  | typeof STEP_UP_PURPOSE_ACCOUNT_DELETE;

type StepUpPayload = {
  sub: string;
  purpose: StepUpPurpose;
};

@Injectable()
export class ProfileStepUpTokenService {
  sign(
    uid: string,
    purpose: StepUpPurpose,
  ): { stepUpToken: string; expiresInSeconds: number } {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }
    const expiresInSeconds = this.expiresInSeconds();
    const stepUpToken = sign(
      { sub: uid, purpose } satisfies StepUpPayload,
      secret,
      { expiresIn: expiresInSeconds },
    );
    return { stepUpToken, expiresInSeconds };
  }

  /** Ensures token is valid, unexpired, bound to `expectedUid`, and matches `purpose`. */
  assertValid(
    stepUpToken: string,
    expectedUid: string,
    purpose: StepUpPurpose,
  ): void {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }
    let payload: StepUpPayload;
    try {
      payload = verify(stepUpToken.trim(), secret) as StepUpPayload;
    } catch (e) {
      this.rethrowJwtError(e, purpose);
    }
    if (payload.purpose !== purpose || payload.sub !== expectedUid) {
      throw new UnauthorizedException('Invalid step-up token');
    }
  }

  private expiresInSeconds(): number {
    const raw = process.env.PROFILE_STEP_UP_EXPIRES_IN?.trim();
    if (!raw) {
      return 15 * 60;
    }
    const match = /^(\d+)([smh])$/.exec(raw);
    if (!match) {
      return 15 * 60;
    }
    const n = Number(match[1]);
    const unit = match[2];
    if (unit === 's') return n;
    if (unit === 'm') return n * 60;
    return n * 3600;
  }

  private rethrowJwtError(e: unknown, purpose: StepUpPurpose): never {
    if (e instanceof TokenExpiredError) {
      throw new UnauthorizedException(
        purpose === STEP_UP_PURPOSE_ACCOUNT_DELETE
          ? 'Account deletion verification expired'
          : 'Profile verification expired',
      );
    }
    if (e instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid step-up token');
    }
    throw e;
  }
}
