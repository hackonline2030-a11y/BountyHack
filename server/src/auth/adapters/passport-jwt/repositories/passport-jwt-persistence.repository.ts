import type {
  AuthenticatedSession,
  AuthenticatedUserProfile,
} from '../../../application/models/authenticated-session';
import type { AppRoleCode } from '../../../../shared/rbac/app-role.code';
import { Identity } from '../../../domain/models/identity';

export type PassportJwtRegisterInput = {
  email: string;
  username: string;
  password: string;
  /** Ignored by non-Postgres backends. */
  roleCode?: AppRoleCode;
};

export type PassportJwtLoginInput = {
  email: string;
  password: string;
  code?: string;
};

export type PassportJwtPersistence = {
  getUserByUid(uid: string): Promise<Identity>;
  getAuthUserPublicProfile(uid: string): Promise<AuthenticatedUserProfile>;
  register(input: PassportJwtRegisterInput): Promise<AuthenticatedSession>;
  login(input: PassportJwtLoginInput): Promise<AuthenticatedSession>;
};
