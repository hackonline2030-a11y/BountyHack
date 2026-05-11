import type { AppRoleCode } from '../../../shared/rbac/app-role.code';

export interface Identity {
  email: string;
  uid: string;
  /** From Postgres `roles.name` after JWT validation (Prisma path). Undefined if not loaded yet. */
  roleCode?: AppRoleCode | null;
}
