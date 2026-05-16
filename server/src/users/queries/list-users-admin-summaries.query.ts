import { Inject } from '@nestjs/common';
import {
  I_USER_REPOSITORY,
  IUserRepository,
} from '../ports/user-repository.interface';
import { UserAdminSummary } from '../models';
import { Executable } from '../../shared/executable';

type Request = void;
type Response = UserAdminSummary[];

/**
 * Lists every user as an admin-facing summary (uid, username, email, roleCode).
 *
 * Pure application-layer use case: it depends only on the {@link IUserRepository}
 * port, knows nothing about HTTP, transport, or authentication. RBAC enforcement
 * lives at the boundary (`@AuthRoles(SUPER_ADMIN)` on the controller). Calling
 * this query from a non-admin code path would silently leak the full user list,
 * so every entry-point that wires it MUST gate the role explicitly.
 */
export class ListUsersAdminSummariesQuery
  implements Executable<Request, Response>
{
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(): Promise<Response> {
    return this.repository.listAdminSummaries();
  }
}
