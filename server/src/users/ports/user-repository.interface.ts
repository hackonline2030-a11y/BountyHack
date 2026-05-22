import type { AppRoleCode } from '../../shared/rbac/app-role.code';
import { CreateUserProfilePayload } from '../payloads';
import type { UpdateOwnProfilePayload } from '../payloads/update-own-profile.payload';
import { UserAdminSummary, UserRecord } from '../models';

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository {
  addUsername(data: CreateUserProfilePayload): Promise<void>;
  findById(id: string): Promise<UserRecord | null>;
  /**
   * Returns every user as an admin-facing summary (uid, username, email, roleCode).
   *
   * **Admin-only consumer:** callers must enforce `SUPER_ADMIN` at the HTTP / page
   * boundary before invoking this method — the repository does not check identity.
   * Sorted by `username` for deterministic UI rendering. Bound by the size of the
   * `users` table for now; introduce pagination once the population grows large
   * enough that a single response becomes too heavy.
   */
  listAdminSummaries(): Promise<UserAdminSummary[]>;
  /** Lookup by `users.id` with role resolved (coordinator workflows). */
  findSummaryById(uid: string): Promise<UserAdminSummary | null>;
  /** Users whose global role matches `roleCode` (e.g. all hunters). */
  listSummariesByRoleCode(roleCode: AppRoleCode): Promise<UserAdminSummary[]>;
  /**
   * Hard-deletes the user and cascaded dependents. Caller must enforce
   * SUPER_ADMIN, forbid self-delete, and protect the last super-admin.
   */
  deleteCompletely(uid: string): Promise<void>;

  /** Verifies the account password for `uid` (password-login accounts only). */
  verifyPassword(uid: string, plainPassword: string): Promise<boolean>;

  /**
   * Updates profile fields for `uid`. Caller must enforce self-service only
   * (`uid` from JWT, never from client-supplied user id).
   */
  updateOwnProfile(uid: string, patch: UpdateOwnProfilePayload): Promise<UserRecord>;
}
