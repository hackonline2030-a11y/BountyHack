import type { AuthenticatedSession } from './authenticated-session';
import type { AuthenticatedUserProfile } from './authenticated-session';

export type RegisterUserByAdminInvitationResult = {
  kind: 'invitation';
  user: AuthenticatedUserProfile;
  invitationSent: true;
};

export type RegisterUserByAdminFakeUserResult = {
  kind: 'fakeUser';
  user: AuthenticatedUserProfile;
  accountSetupLink: string;
};

export type RegisterUserByAdminSessionResult = {
  kind: 'session';
  session: AuthenticatedSession;
};

export type RegisterUserByAdminResult =
  | RegisterUserByAdminInvitationResult
  | RegisterUserByAdminFakeUserResult
  | RegisterUserByAdminSessionResult;
