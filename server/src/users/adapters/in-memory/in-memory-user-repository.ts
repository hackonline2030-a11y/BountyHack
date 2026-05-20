import { Injectable, Optional } from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import { IUserRepository } from '../../ports/user-repository.interface';
import { UserAdminSummary, UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
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
    return { uid: id, username: 'test-user' };
  }

  /**
   * Admin listing is only wired against Postgres-Prisma in the current iteration.
   * The in-memory adapter (used in tests) returns an empty list so the contract
   * stays honourable without leaking ad-hoc test data through this surface.
   */
  async listAdminSummaries(): Promise<UserAdminSummary[]> {
    return [];
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
    };
  }

  async listSummariesByRoleCode(_roleCode: AppRoleCode): Promise<UserAdminSummary[]> {
    return [];
  }
}
