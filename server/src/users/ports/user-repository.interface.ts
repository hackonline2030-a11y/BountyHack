import { CreateUserProfilePayload } from '../payloads';
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
}
