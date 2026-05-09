import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import { TwoFactorMethod } from '../../generated/prisma/enums';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { variables } from '../../shared/variables.config';
import {
  sealTotpSecretForStorage,
  openTotpSecretFromStorage,
} from '../adapters/totp/totp-secret-seal';
import { TOTP_DEMO } from './demo/totp-crypto';

export type TotpEnrollmentStartResult = {
  /** Secret Base32 (saisie manuelle — transmettre seulement en HTTPS prod). */
  secret: string;
  otpauthUri: string;
  secretQrCode: string;
};

@Injectable()
export class TotpEnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Préparer l’activation TOTP (upsert ligne `two_factor`, secret chiffré en base).
   * Aligné avec le flux décrit dans l’article Medium (OTPAuth / otplib + stockage sécurisé).
   */
  async startEnrollment(
    userId: string,
    identityEmail: string,
  ): Promise<TotpEnrollmentStartResult> {
    this.assertPrisma();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const email = (user.email ?? identityEmail)?.trim().toLowerCase();
    const label =
      (user.username?.trim() ||
        email ||
        userId.substring(0, 8));

    const twoFactor = await this.prisma.twoFactor.upsert({
      where: {
        userId_method: {
          userId,
          method: TwoFactorMethod.APP,
        },
      },
      update: { verified: false },
      create: {
        userId,
        method: TwoFactorMethod.APP,
        verified: false,
      },
    });

    await this.prisma.twoFactorTotp.deleteMany({
      where: { twoFactorId: twoFactor.id },
    });

    const secret = generateSecret();
    const encrypted = sealTotpSecretForStorage(secret);

    await this.prisma.twoFactorTotp.create({
      data: {
        twoFactorId: twoFactor.id,
        secret: encrypted,
      },
    });

    const issuer =
      process.env.TOTP_ISSUER?.trim() || 'BugBountyApp';
    const otpauthUri = generateURI({
      strategy: 'totp',
      issuer,
      label,
      secret,
      algorithm: TOTP_DEMO.algorithm,
      digits: TOTP_DEMO.digits,
      period: TOTP_DEMO.period,
    });

    const secretQrCode = await QRCode.toDataURL(otpauthUri);

    return { secret, otpauthUri, secretQrCode };
  }

  /** Valide un code puis active définitivement le TOTP sur le compte. */
  async confirmEnrollment(userId: string, codeRaw: string): Promise<{ ok: true }> {
    this.assertPrisma();
    const token = codeRaw.replace(/\s/g, '');

    const twoFactor = await this.prisma.twoFactor.findUnique({
      where: {
        userId_method: {
          userId,
          method: TwoFactorMethod.APP,
        },
      },
      include: { totp: true },
    });

    if (!twoFactor?.totp?.secret) {
      throw new BadRequestException({
        error: 'totp_setup_missing',
        message: 'Start enrollment first (POST auth/totp/enable/start).',
      });
    }

    if (twoFactor.verified) {
      throw new ConflictException({
        error: 'totp_already_enabled',
        message: 'Authenticator is already verified for this account.',
      });
    }

    const secretPlain = openTotpSecretFromStorage(twoFactor.totp.secret);
    const result = await verify({
      secret: secretPlain,
      token,
      strategy: 'totp',
      algorithm: TOTP_DEMO.algorithm,
      digits: TOTP_DEMO.digits,
      period: TOTP_DEMO.period,
      epochTolerance: TOTP_DEMO.epochToleranceSeconds,
    });

    if (!result.valid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.prisma.$transaction([
      this.prisma.twoFactor.update({
        where: { id: twoFactor.id },
        data: { verified: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: BigInt(1) },
      }),
    ]);

    return { ok: true };
  }

  private assertPrisma(): void {
    if (variables.database !== 'POSTGRESQL_PRISMA') {
      throw new NotImplementedException(
        'TOTP enrollment requires DATABASE_NAME=POSTGRESQL_PRISMA',
      );
    }
  }
}
