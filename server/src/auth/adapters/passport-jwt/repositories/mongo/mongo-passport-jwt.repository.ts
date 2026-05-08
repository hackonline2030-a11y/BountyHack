import {
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

  async register(input: PassportJwtRegisterInput): Promise<PassportJwtAuthResult> {
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

  async login(input: PassportJwtLoginInput): Promise<PassportJwtAuthResult> {
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

    return {
      token: this.jwtTokenService.signToken(String(doc._id), doc.email ?? email),
      user: {
        email: doc.email ?? email,
        uid: String(doc._id),
        username: doc.username,
      },
      require2FA: false,
    };
  }
}
