import type {
  AuthenticatedSession,
  AuthenticatedUserProfile,
} from '../../../application/models/authenticated-session';
import type { AppRoleCode } from '../../../../shared/rbac/app-role.code';
import { Identity } from '../../../domain/models/identity';

export type PassportJwtRegisterInput = {
  email: string;
  username: string;
  /** When omitted, user is created pending activation (Prisma SQL only). */
  password?: string;
  /** Ignored by non-Postgres backends. */
  roleCode?: AppRoleCode;
};

export type PassportJwtLoginInput = {
  email: string;
  password: string;
  code?: string;
};

export type PassportJwtRegisterPendingInput = {
  email: string;
  username: string;
  roleCode?: AppRoleCode;
};

export type PassportJwtPersistence = {
  getUserByUid(uid: string): Promise<Identity>;
  getAuthUserPublicProfile(uid: string): Promise<AuthenticatedUserProfile>;
  register(input: PassportJwtRegisterInput): Promise<AuthenticatedSession>;
  /** Creates user with no password hash (activation via setup link). */
  registerPendingActivation(
    input: PassportJwtRegisterPendingInput,
  ): Promise<AuthenticatedUserProfile>;
  login(input: PassportJwtLoginInput): Promise<AuthenticatedSession>;
};
