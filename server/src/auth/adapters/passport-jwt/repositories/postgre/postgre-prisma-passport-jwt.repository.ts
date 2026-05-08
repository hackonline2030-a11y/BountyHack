import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../core/infrastructure/database/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { Identity } from '../../../../domain/models/identity';
import { verifyPassword, hashPassword } from '../../../password.util';
import { PassportJwtTokenService } from '../../services/passport-jwt-token.service';
import {
  PassportJwtAuthResult,
  PassportJwtLoginInput,
  PassportJwtPersistence,
  PassportJwtRegisterInput,
} from '../passport-jwt-persistence.repository';

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
      select: { id: true, email: true },
    });
    if (!row) {
      throw new UnauthorizedException('User not found');
    }
    return { uid: row.id, email: row.email ?? '' };
  }

  async register(input: PassportJwtRegisterInput): Promise<PassportJwtAuthResult> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const uid = randomUUID();
    const passwordHash = await hashPassword(input.password);

    try {
      await this.prisma.user.create({
        data: {
          id: uid,
          username,
          email,
          passwordHash,
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

  async login(input: PassportJwtLoginInput): Promise<PassportJwtAuthResult> {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is not available');
    }
    const email = input.email.trim().toLowerCase();
    const row = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, passwordHash: true },
    });
    if (!row?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(input.password, row.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.jwtTokenService.signToken(row.id, row.email ?? email),
      user: {
        email: row.email ?? email,
        uid: row.id,
        username: row.username,
      },
      require2FA: false,
    };
  }
}
