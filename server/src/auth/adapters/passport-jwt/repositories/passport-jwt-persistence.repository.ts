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

export type PassportJwtAuthResult = {
  token: string;
  user: {
    uid: string;
    email: string;
    username: string;
  };
  require2FA?: boolean;
};

export type PassportJwtPersistence = {
  getUserByUid(uid: string): Promise<Identity>;
  register(input: PassportJwtRegisterInput): Promise<PassportJwtAuthResult>;
  login(input: PassportJwtLoginInput): Promise<PassportJwtAuthResult>;
};
