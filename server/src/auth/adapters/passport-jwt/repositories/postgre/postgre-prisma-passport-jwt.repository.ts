import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { TwoFactorMethod } from '../../../../../generated/prisma/enums';
import { PrismaService } from '../../../../../core/infrastructure/database/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { verify } from 'otplib';
import type {
  AuthenticatedSession,
  AuthenticatedUserProfile,
} from '../../../../application/models/authenticated-session';
import { Identity } from '../../../../domain/models/identity';
import { verifyPassword, hashPassword } from '../../../utils/password.util';
import { openTotpSecretFromStorage } from '../../../../adapters/totp/totp-secret-seal';
import { TOTP_CONFIG } from '../../../../application/totp-config';
import { PassportJwtTokenService } from '../../services/passport-jwt-token.service';
import {
  PassportJwtLoginInput,
  PassportJwtPersistence,
  PassportJwtRegisterInput,
} from '../passport-jwt-persistence.repository';
import {
  APP_ROLE_CODE_VALUES,
  AppRoleCode,
} from '../../../../../shared/rbac/app-role.code';

@Injectable()
export class PostgrePrismaPassportJwtRepository
  implements PassportJwtPersistence
{
  constructor(
    private readonly jwtTokenService: PassportJwtTokenService,
    @Optional()
    private readonly prisma?: PrismaService,
  ) {}

  async getUserByUid(uid: string): Promise<Identity> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const row = await this.prisma.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        email: true,
        role: { select: { name: true } },
      },
    });
    if (!row) {
      throw new UnauthorizedException('User not found');
    }
    const rawName = row.role?.name;
    const roleCode =
      rawName !== undefined &&
      typeof rawName === 'string' &&
      APP_ROLE_CODE_VALUES.includes(rawName as AppRoleCode)
        ? (rawName as AppRoleCode)
        : null;
    return { uid: row.id, email: row.email ?? '', roleCode };
  }

  async getAuthUserPublicProfile(uid: string): Promise<AuthenticatedUserProfile> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const row = await this.prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, username: true },
    });
    if (!row) {
      throw new UnauthorizedException('User not found');
    }
    return {
      uid: row.id,
      email: row.email ?? '',
      username: row.username,
    };
  }

  async register(input: PassportJwtRegisterInput): Promise<AuthenticatedSession> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const uid = randomUUID();
    const passwordHash = await hashPassword(input.password);
    const roleCode = input.roleCode ?? AppRoleCode.USER;
    const role = await this.prisma.role.findUnique({
      where: { name: roleCode },
      select: { id: true },
    });
    if (!role) {
      throw new BadRequestException(
        `Role "${roleCode}" not found — run migrations and seed (\`roles\` table).`,
      );
    }

    try {
      await this.prisma.user.create({
        data: {
          id: uid,
          username,
          email,
          passwordHash,
          roleId: role.id,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    return {
      token: this.jwtTokenService.signToken(uid, email),
      user: { email, uid, username },
      require2FA: false,
    };
  }

  async login(input: PassportJwtLoginInput): Promise<AuthenticatedSession> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const email = input.email.trim().toLowerCase();
    const row = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactors: {
          where: { method: TwoFactorMethod.APP },
          select: {
            verified: true,
            totp: { select: { secret: true } },
          },
          take: 1,
        },
      },
    });
    if (!row?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(input.password, row.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const requiresTotp = row.twoFactorEnabled !== BigInt(0);
    if (requiresTotp) {
      const code = (input.code ?? '').replace(/\s/g, '');
      if (!/^\d{6,8}$/.test(code)) {
        throw new UnauthorizedException('TOTP code required');
      }

      const active = row.twoFactors[0];
      if (!active?.verified || !active.totp?.secret) {
        throw new UnauthorizedException('TOTP is enabled but not configured');
      }

      const secretPlain = openTotpSecretFromStorage(active.totp.secret);
      const result = await verify({
        secret: secretPlain,
        token: code,
        strategy: 'totp',
        algorithm: TOTP_CONFIG.algorithm,
        digits: TOTP_CONFIG.digits,
        period: TOTP_CONFIG.period,
        epochTolerance: TOTP_CONFIG.epochToleranceSeconds,
      });
      if (!result.valid) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    const resolvedEmail = row.email ?? email;
    return {
      token: this.jwtTokenService.signToken(row.id, resolvedEmail),
      user: {
        email: resolvedEmail,
        uid: row.id,
        username: row.username,
      },
      require2FA: false,
    };
  }
}
