import { UserDetails } from '../model/user-details';
import { RegisterDto, LoginDto, AuthResponse } from '../dto/auth-common.dto';

export const AuthRepository = Symbol('AuthRepository');

export interface AuthRepository {

  /**
   * Validates a token and retrieves a user's information
   * @param token
   */
  getUserFromToken(token: string): Promise<UserDetails>;

  /**
   * Retrieves a user by their UID
   * @param uid
   */
  getUserByUid(uid: string): Promise<UserDetails>;

  /**
   * Registers a new user
   * @returns Token JWT + user info
   */
  register(data: RegisterDto): Promise<AuthResponse>;

  /**
   * Connects an existing user
   * @retruns Token JWT + user info
   */
  login(data: LoginDto): Promise<AuthResponse>;

  /**
   * Logout a user (invalidating the token)
   */
  logout(token: string): Promise<void>;
}
