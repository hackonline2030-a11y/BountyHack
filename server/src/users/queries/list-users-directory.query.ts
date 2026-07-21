import { Inject } from '@nestjs/common';
import {
  I_USER_REPOSITORY,
  IUserRepository,
} from '../ports/user-repository.interface';
import type { AppRoleCode } from '../../shared/rbac/app-role.code';
import { Executable } from '../../shared/executable';

/**
 * Public directory row: only non-sensitive, publicly displayable fields.
 * Email and account status are intentionally excluded (personal data / RGPD).
 */
export type UserDirectoryEntry = {
  uid: string;
  username: string;
  roleCode: AppRoleCode | null;
};

type Request = void;
type Response = UserDirectoryEntry[];

/**
 * Lists users for the public directory (annuaire): username + role only.
 *
 * Application-layer use case depending solely on {@link IUserRepository}. It
 * reuses the existing admin-summary read model but strips every field that is
 * not safe to expose to any authenticated user (email, account status,
 * fake-user flag). Access is gated at the controller with `@Auth()` so only
 * authenticated users can read the directory.
 */
export class ListUsersDirectoryQuery implements Executable<Request, Response> {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(): Promise<Response> {
    const summaries = await this.repository.listAdminSummaries();
    return summaries.map((summary) => ({
      uid: summary.uid,
      username: summary.username,
      roleCode: summary.roleCode,
    }));
  }
}
