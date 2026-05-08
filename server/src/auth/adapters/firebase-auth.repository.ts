import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Identity } from '../domain/models/identity';
import { AuthRepository } from '../ports/auth.repository';
import { RegisterDto, AuthResponse, LoginDto } from '../dto/auth-common.dto';

@Injectable()
export class FirebaseAuthRepository implements AuthRepository {
  async getUserFromToken(token: string): Promise<Identity> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      return {
        email: decodedToken.email,
        uid: decodedToken.uid,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async getUserByUid(uid: string): Promise<Identity> {
    try {
      const user = await admin.auth().getUser(uid);

      return {
        email: user.email ?? '',
        uid: user.uid,
      };
    } catch (error) {
      throw new UnauthorizedException(`User not found: ${uid}`);
    }
  }

  /**
   * Register a user through Firebase Admin SDK
   *
   * Note : Firebase recommends to create accounts client-side,
   * but creating them server-side is also possible with Admin SDK
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      const userRecord = await admin.auth().createUser(
        {
          email: data.email,
          password: data.password,
          displayName: data.username,
          emailVerified: false, // TODO email verification implementation
        }
      );

      //Custom claim définition
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        username: data.username,
      });

      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      return {
        token: customToken,
        user: {
          uid: userRecord.uid,
          email: userRecord.email ?? data.email,
          username: data.username,
        },
        require2FA: false,
      };
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('Email already registered');
      }

      if (error.code === 'auth/invalid-email') {
        throw new UnauthorizedException('Invalid email format');
      }

      if (error.code === 'auth/weak-password') {
        throw new UnauthorizedException('Password is too weak (minimum 6 characters)');
      }

      console.error('Firebase register error:', error);
      throw new InternalServerErrorException('Failed to create user account');
    }
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    try {
      const firebaseWebApiKey = process.env.FIREBASE_WEB_API_KEY;

      if (!firebaseWebApiKey) {
        throw new InternalServerErrorException(
          'FIREBASE_WEB_API_KEY is not configured. ' +
          'Get it from Firebase Console > Project Settings > General > Web API Key'
        );
      }

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            returnSecureToken: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.error?.message === 'EMAIL_NOT_FOUND' ||
          errorData.error?.message === 'INVALID_PASSWORD') {
          throw new UnauthorizedException('Invalid credentials');
        }

        if (errorData.error?.message === 'USER_DISABLED') {
          throw new UnauthorizedException('User account has been disabled');
        }

        throw new UnauthorizedException('Authentication failed');
      }

      const authData = await response.json();

      const userRecord = await admin.auth().getUser(authData.localId);

      return {
        token: authData.idToken, // Firebase ID Token (to use for requests)
        user: {
          uid: userRecord.uid,
          email: userRecord.email ?? data.email,
          username: userRecord.displayName ?? '',
        },
        require2FA: false,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Firebase login error:', error);
      throw new InternalServerErrorException('Failed to login');
    }
  }

  /**
   * Logout a user
   *
   * Firebase is stateless server-side (like JWT)
   * Here, we revoke all the user's refresh tokens
   */
  async logout(userId: string): Promise<void> {
    try {
      await admin.auth().revokeRefreshTokens(userId);

      console.log(`Revoked refresh tokens for user ${userId}`);
    } catch (error) {
      console.error('Firebase login error:', error);
    }
  }
}
