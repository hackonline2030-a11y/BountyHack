import type { AuthenticatedSession } from '../application/models/authenticated-session';
import type { LoginWithPasswordInput } from '../application/models/login-with-password.input';
import type { RegisterWithPasswordInput } from '../application/models/register-with-password.input';
import { Identity } from '../domain/models/identity';

export const AuthRepository = Symbol('AuthRepository');

export interface AuthRepository {

  /**
   * Validates a token and retrieves a user's information
   * @param token
   */
  getUserFromToken(token: string): Promise<Identity>;

  /**
   * Retrieves a user by their UID
   * @param uid
   */
  getUserByUid(uid: string): Promise<Identity>;

  /**
   * Registers a new user
   * @returns Token JWT + user info
   */
  register(data: RegisterWithPasswordInput): Promise<AuthenticatedSession>;

  /**
   * Connects an existing user
   * @retruns Token JWT + user info
   */
  login(data: LoginWithPasswordInput): Promise<AuthenticatedSession>;

  /**
   * Issues a new session from a refresh token (provided by HTTP adapter: cookie or body).
   * JWT refresh wiring lives in the repository adapter.
   */
  refreshAccessToken(refreshToken: string): Promise<AuthenticatedSession>;

  /**
   * Logout a user (invalidating the token)
   */
  logout(token: string): Promise<void>;
}
