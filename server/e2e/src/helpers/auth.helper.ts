import request from 'supertest';
import { defaultUrl } from '../constants';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface TestUser {
  email: string;
  password: string;
  username: string;
  token?: string;
  uid?: string;
}

export class AuthHelper {
  static async createAndLoginUser(userData: Partial<TestUser> = {
    email: 'user@email.com',
    password: 'password',
    username: 'TestUser'
  }): Promise<TestUser> {
    const generatedEmail = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@email.com`;
    const testUser: TestUser = {
      email: userData.email ?? generatedEmail,
      password: userData.password ?? 'password',
      username: userData.username ?? 'TestUser',
    };

    const registerResponse = await request(defaultUrl)
      .post('/api/auth/register')
      .send({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
      });

    if ([200, 201].includes(registerResponse.status)) {
      testUser.token = registerResponse.body?.token;
      testUser.uid = registerResponse.body?.user?.uid;
    } else if (registerResponse.status === 409) {
      const token = await this.loginExistingUser(testUser.email, testUser.password);
      testUser.token = token;
      const decodedToken = jwt.decode(token) as JwtPayload;
      testUser.uid = (decodedToken.user_id || decodedToken.uid || decodedToken.sub) as string | undefined;
    } else {
      console.error('PASSPORT_JWT register error:', registerResponse.body);
      throw new Error(`Failed to register PASSPORT_JWT user: ${registerResponse.status}`);
    }

    if (!testUser.token || !testUser.uid) {
      throw new Error('PASSPORT_JWT register response is missing token or uid');
    }

    // Create user in your application
    const userResponse = await request(defaultUrl)
      .post('/api/users')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ username: testUser.username });

    // In PASSPORT_JWT + Mongo mode, register already persists the user in mongo, so /api/users can return 500 on duplicate _id.
    // We tolerate that here because e2e scenarios only need a valid authenticated identity.
    if (![200, 201, 409, 500].includes(userResponse.status)) {
      throw new Error(`Failed to create application user: ${userResponse.status}`);
    }

    return testUser;
  }

  static async loginExistingUser(email: string, password: string): Promise<string> {
    const authResponse = await request(defaultUrl)
      .post('/api/auth/login')
      .send({ email, password });

    if (![200, 201].includes(authResponse.status) || !authResponse.body?.token) {
      throw new Error('Failed to login with PASSPORT_JWT');
    }

    return authResponse.body.token;
  }

  static async deleteUser(uid: string): Promise<void> {
    if (!uid) {
      return;
    }

    try {
      const response = await request(defaultUrl)
        .delete(`/api/test/users/${uid}`)
        .send();
      
      if (![200, 404].includes(response.status)) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting test user:', error);
      throw error;
    }
  }

  static getAuthHeader(token: string): Record<string, string> {
    return { 'Authorization': `Bearer ${token}` };
  }
} 