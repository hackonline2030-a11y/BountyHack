import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import type { AuthenticatedSession } from '../models/authenticated-session';
import { TwoFactorMethod } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import { attachOpaqueRefreshToSession } from '../../adapters/utils/opaque-refresh-token.util';
import { PassportJwtTokenService } from '../../adapters/passport-jwt/services/passport-jwt-token.service';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../ports/refresh-token.repository';
import { LoginWithPasswordCommand } from '../commands/login-with-password.command';
import { variables } from '../../../shared/variables.config';
import {
  openTotpSecretFromStorage,
  sealTotpSecretForStorage,
} from '../../adapters/totp/totp-secret-seal';
import { TOTP_DEMO } from './totp-crypto';

/** JSON body when TOTP enrolment UI should be shown (aligné articles Logto / express). */
export type TotpDemoMissingTotpBody = {
  error: 'missing_totp';
  secretQrCode: string;
  otpauthUri?: string;
  userId?: string;
};

/** JSON body quand un TOTP vérifié existe déjà ; prochaine étape : code + `complete`. */
export type TotpDemoVerificationRequiredBody = {
  error: 'totp_verification_required';
  userId: string;
  email: string;
};

@Injectable()
export class TotpSignInDemoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loginWithPassword: LoginWithPasswordCommand,
    private readonly jwtTokenService: PassportJwtTokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  /**
   * Après vérif mot de passe : soit renvoie données pour liaison TOTP (403 + QR),
   * soit indique qu’il faut fournir un code TOTP pour se connecter (403).
   */
  async afterPasswordCheck(
    emailRaw: string,
    password: string,
  ): Promise<never> {
    this.assertPrismaDemo();

    const email = emailRaw.trim().toLowerCase();
    const auth = await this.authenticatePassword(email, password);
    const userId = auth.user.uid;
    const username = auth.user.username;

    const existing = await this.prisma.twoFactor.findUnique({
      where: {
        userId_method: { userId, method: TwoFactorMethod.APP },
      },
      include: { totp: true },
    });

    if (existing?.verified) {
      throw new HttpException(
        {
          error: 'totp_verification_required',
          userId,
          email: auth.user.email,
        } satisfies TotpDemoVerificationRequiredBody,
        HttpStatus.FORBIDDEN,
      );
    }

    let secret: string;
    if (existing?.totp?.secret) {
      secret = openTotpSecretFromStorage(existing.totp.secret);
    } else {
      secret = generateSecret();
      const secretStored = this.sealDemoSecret(secret);
      if (existing) {
        await this.prisma.twoFactorTotp.create({
          data: {
            twoFactorId: existing.id,
            secret: secretStored,
          },
        });
      } else {
        await this.prisma.twoFactor.create({
          data: {
            userId,
            method: TwoFactorMethod.APP,
            verified: false,
            totp: {
              create: { secret: secretStored },
            },
          },
        });
      }
    }

    const issuer =
      process.env.TOTP_ISSUER?.trim() || 'BugBountyApp';
    const otpauthUri = generateURI({
      strategy: 'totp',
      issuer,
      label: username || email,
      secret,
      algorithm: TOTP_DEMO.algorithm,
      digits: TOTP_DEMO.digits,
      period: TOTP_DEMO.period,
    });
    const secretQrCode = await QRCode.toDataURL(otpauthUri);

    throw new HttpException(
      {
        error: 'missing_totp',
        secretQrCode,
        otpauthUri,
        userId,
      } satisfies TotpDemoMissingTotpBody,
      HttpStatus.FORBIDDEN,
    );
  }

  /**
   * Après scan du QR : vérifie le code TOTP puis marque la méthode `APP` comme vérifiée (Logto `/verify-totp`).
   */
  async verifyBinding(
    emailRaw: string,
    password: string,
    codeRaw: string,
  ): Promise<{ ok: true; message: string }> {
    this.assertPrismaDemo();
    const email = emailRaw.trim().toLowerCase();
    const token = codeRaw.replace(/\s/g, '');
    await this.authenticatePassword(email, password);

    const row = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!row) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const twoFactor = await this.prisma.twoFactor.findUnique({
      where: {
        userId_method: { userId: row.id, method: TwoFactorMethod.APP },
      },
      include: { totp: true },
    });

    if (!twoFactor?.totp?.secret) {
      throw new BadRequestException({
        error: 'totp_not_setup',
        message: 'Scan the QR first (POST .../totp-sign-in/step).',
      });
    }

    if (twoFactor.verified) {
      throw new ConflictException({
        error: 'totp_already_verified',
        message: 'Authenticator is already bound; use complete login.',
      });
    }

    const valid = await this.isTotpValid(
      openTotpSecretFromStorage(twoFactor.totp.secret),
      token,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.prisma.$transaction([
      this.prisma.twoFactor.update({
        where: { id: twoFactor.id },
        data: { verified: true },
      }),
      this.prisma.user.update({
        where: { id: row.id },
        data: { twoFactorEnabled: BigInt(1) },
      }),
    ]);

    return {
      ok: true,
      message: 'TOTP bound successfully. Use POST .../totp-sign-in/complete to sign in with password + code.',
    };
  }

  /**
   * Connexion complète lorsque le TOTP est déjà vérifié : JWT comme `POST /auth/login`.
   */
  async completeLoginWithTotp(
    emailRaw: string,
    password: string,
    codeRaw: string,
  ): Promise<AuthenticatedSession> {
    this.assertPrismaDemo();
    const email = emailRaw.trim().toLowerCase();
    const token = codeRaw.replace(/\s/g, '');
    await this.authenticatePassword(email, password);

    const row = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true },
    });
    if (!row?.email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const twoFactor = await this.prisma.twoFactor.findUnique({
      where: {
        userId_method: { userId: row.id, method: TwoFactorMethod.APP },
      },
      include: { totp: true },
    });

    if (!twoFactor?.verified || !twoFactor.totp?.secret) {
      throw new ForbiddenException({
        error: 'totp_not_ready',
        message: 'Complete QR setup and verify binding first.',
      });
    }

    const valid = await this.isTotpValid(
      openTotpSecretFromStorage(twoFactor.totp.secret),
      token,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    const emailResolved = row.email ?? '';
    const accessToken = this.jwtTokenService.signToken(row.id, emailResolved);
    const session: AuthenticatedSession = {
      token: accessToken,
      user: {
        uid: row.id,
        email: row.email ?? emailResolved,
        username: row.username,
      },
      require2FA: false,
    };
    return attachOpaqueRefreshToSession(
      this.refreshTokenRepository,
      session,
    );
  }

  /**
   * Si `TOTP_ENCRYPTION_KEY` est défini, même format que l’enrollment prod ; sinon secret en clair (démo locale).
   */
  private sealDemoSecret(secretPlainBase32: string): string {
    const k = process.env.TOTP_ENCRYPTION_KEY?.trim();
    if (k && k.length >= 16) {
      return sealTotpSecretForStorage(secretPlainBase32);
    }
    return secretPlainBase32;
  }

  private assertPrismaDemo(): void {
    if (variables.database !== 'POSTGRESQL_PRISMA') {
      throw new NotImplementedException(
        'TOTP sign-in demo is only available with DATABASE_NAME=POSTGRESQL_PRISMA',
      );
    }
  }

  private async authenticatePassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedSession> {
    try {
      return await this.loginWithPassword.execute({ email, password });
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw e;
    }
  }

  private async isTotpValid(secret: string, token: string): Promise<boolean> {
    const result = await verify({
      secret,
      token,
      strategy: 'totp',
      algorithm: TOTP_DEMO.algorithm,
      digits: TOTP_DEMO.digits,
      period: TOTP_DEMO.period,
      epochTolerance: TOTP_DEMO.epochToleranceSeconds,
    });
    return result.valid === true;
  }
}
