import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { MongoUser } from '../../../../../users/adapters/mongo/mongo-user';
import type {
  AuthenticatedSession,
  AuthenticatedUserProfile,
} from '../../../../application/models/authenticated-session';
import { Identity } from '../../../../domain/models/identity';
import { verifyPassword, hashPassword } from '../../../utils/password.util';
import { PassportJwtTokenService } from '../../services/passport-jwt-token.service';
import {
  PassportJwtLoginInput,
  PassportJwtPersistence,
  PassportJwtRegisterInput,
} from '../passport-jwt-persistence.repository';

@Injectable()
export class MongoPassportJwtRepository
  implements PassportJwtPersistence
{
  constructor(
    private readonly jwtTokenService: PassportJwtTokenService,
    @Optional()
    @Inject(getModelToken(MongoUser.CollectionName))
    private readonly userModel?: Model<MongoUser.SchemaClass>,
  ) {}

  async getUserByUid(uid: string): Promise<Identity> {
    if (!this.userModel) {
      throw new InternalServerErrorException('Mongo user model is not available');
    }
    const doc = await this.userModel.findById(uid).lean();
    if (!doc) {
      throw new UnauthorizedException('User not found');
    }
    return { uid: String(doc._id), email: doc.email ?? '' };
  }

  async getAuthUserPublicProfile(uid: string): Promise<AuthenticatedUserProfile> {
    if (!this.userModel) {
      throw new InternalServerErrorException('Mongo user model is not available');
    }
    const doc = await this.userModel.findById(uid).lean();
    if (!doc?._id) {
      throw new UnauthorizedException('User not found');
    }
    return {
      uid: String(doc._id),
      email: doc.email ?? '',
      username: doc.username,
    };
  }

  async register(input: PassportJwtRegisterInput): Promise<AuthenticatedSession> {
    if (!this.userModel) {
      throw new InternalServerErrorException('Mongo user model is not available');
    }
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(input.password);

    try {
      await this.userModel.create({
        _id: uid,
        username,
        email,
        passwordHash,
      });
    } catch (error: unknown) {
      const code = (error as { code?: number })?.code;
      if (code === 11000) {
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

  async registerPendingActivation(): Promise<never> {
    throw new BadRequestException(
      'Admin invitation is not supported with MONGODB',
    );
  }

  async login(input: PassportJwtLoginInput): Promise<AuthenticatedSession> {
    if (!this.userModel) {
      throw new InternalServerErrorException('Mongo user model is not available');
    }
    const email = input.email.trim().toLowerCase();
    const doc = await this.userModel.findOne({ email });
    if (!doc?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(input.password, doc.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!doc._id) {
      throw new InternalServerErrorException('Invalid user identifier');
    }

    const resolvedEmail = doc.email ?? email;
    const uid = String(doc._id);
    return {
      token: this.jwtTokenService.signToken(uid, resolvedEmail),
      user: {
        email: resolvedEmail,
        uid,
        username: doc.username,
      },
      require2FA: false,
    };
  }
}
