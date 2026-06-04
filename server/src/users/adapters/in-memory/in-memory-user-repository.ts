import { Injectable, Optional } from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import { IUserRepository } from '../../ports/user-repository.interface';
import { UserAdminActivation, UserAdminSummary, UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
import type { UpdateOwnProfilePayload } from '../../payloads/update-own-profile.payload';
import { User } from '../../entities/user.entity';
import { JwtInMemoryRegistry } from '../../../auth/adapters/passport-jwt/repositories/in-memory/jwt-in-memory-registry';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  constructor(
    @Optional() private readonly jwtRegistry?: JwtInMemoryRegistry,
    @Optional() initialData?: User[]
  ) {
    if (initialData) {
      initialData.forEach((user: User) => {
        this.users.set(user.props.uid || '', user);
      });
    }
  }

  async addUsername(_user: CreateUserProfilePayload): Promise<void> {
    void _user;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const fromJwt = this.jwtRegistry?.findByUid(id);
    if (fromJwt) {
      return fromJwt;
    }
    return { uid: id, username: 'test-user', email: null };
  }

  /**
   * Admin listing is only wired against Postgres-Prisma in the current iteration.
   * The in-memory adapter (used in tests) returns an empty list so the contract
   * stays honourable without leaking ad-hoc test data through this surface.
   */
  async listAdminSummaries(): Promise<UserAdminSummary[]> {
    return [];
  }

  async findAdminActivationById(_uid: string): Promise<UserAdminActivation | null> {
    return null;
  }

  async clearPasswordForAdminReset(_uid: string): Promise<void> {
    return;
  }

  async findSummaryById(uid: string): Promise<UserAdminSummary | null> {
    const record = await this.findById(uid);
    if (record === null) {
      return null;
    }
    return {
      uid: record.uid,
      username: record.username,
      email: null,
      roleCode: AppRoleCode.HUNTER,
      accountStatus: 'valid',
      isFakeUser: false,
    };
  }

  async listSummariesByRoleCode(_roleCode: AppRoleCode): Promise<UserAdminSummary[]> {
    return [];
  }

  async deleteCompletely(uid: string): Promise<void> {
    this.users.delete(uid);
  }

  async verifyPassword(_uid: string, _plainPassword: string): Promise<boolean> {
    return true;
  }

  async updateOwnProfile(
    uid: string,
    patch: UpdateOwnProfilePayload,
  ): Promise<UserRecord> {
    const base = (await this.findById(uid)) ?? {
      uid,
      username: 'test-user',
      email: null,
    };
    return {
      ...base,
      username: patch.username ?? base.username,
      email: patch.email ?? base.email,
    };
  }
}
