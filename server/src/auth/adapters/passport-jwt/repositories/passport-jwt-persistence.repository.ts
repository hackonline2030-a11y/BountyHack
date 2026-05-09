import type {
  AuthenticatedSession,
  AuthenticatedUserProfile,
} from '../../../application/models/authenticated-session';
import { Identity } from '../../../domain/models/identity';

export type PassportJwtRegisterInput = {
  email: string;
  username: string;
  password: string;
};

export type PassportJwtLoginInput = {
  email: string;
  password: string;
};

export type PassportJwtPersistence = {
  getUserByUid(uid: string): Promise<Identity>;
  getAuthUserPublicProfile(uid: string): Promise<AuthenticatedUserProfile>;
  register(input: PassportJwtRegisterInput): Promise<AuthenticatedSession>;
  login(input: PassportJwtLoginInput): Promise<AuthenticatedSession>;
};
