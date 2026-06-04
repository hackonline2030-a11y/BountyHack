import { Test, TestingModule } from '@nestjs/testing';
import { PassportJwtAuthController } from './passport-jwt-auth.controller';
import type { JwtLoginRequestDto, JwtRegisterRequestDto } from '../dto/jwt-auth.dto';
import type { AuthenticatedSession } from '../application/models/authenticated-session';
import type { Request, Response } from 'express';
import { RegisterUserByAdminCommand } from '../application/commands/register-user-by-admin.command';
import { LogoutSessionCommand } from '../application/commands/logout-session.command';
import { RefreshAccessTokenQuery } from '../application/queries/get-refresh-access-token.query';
import { getJwtRefreshCookieName } from '../config/auth-env';
import { AppRoleCode } from '../../shared/rbac/app-role.code';

const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.xcJlZ8F0eB_2oKeNlMJzr45UriVWk5hq80uOq2AMpcI';

describe('PassportJwtAuthController', () => {
  let controller: PassportJwtAuthController;
  let registerUserByAdmin: jest.Mocked<RegisterUserByAdminCommand>;
  let refreshAccessToken: jest.Mocked<Pick<RefreshAccessTokenQuery, 'execute'>>;
  let logoutSession: jest.Mocked<Pick<LogoutSessionCommand, 'execute'>>;

  beforeEach(async () => {
    refreshAccessToken = { execute: jest.fn() };
    logoutSession = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PassportJwtAuthController],
      providers: [
        {
          provide: RegisterUserByAdminCommand,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RefreshAccessTokenQuery,
          useValue: refreshAccessToken,
        },
        {
          provide: LogoutSessionCommand,
          useValue: logoutSession,
        },
      ],
    }).compile();

    controller = module.get(PassportJwtAuthController);
    registerUserByAdmin = module.get(RegisterUserByAdminCommand);
  });

  it('delegates register and returns invitation payload without session cookie', async () => {
    const payload: JwtRegisterRequestDto = {
      email: 'john@example.com',
      username: 'john',
      locale: 'fr',
    };
    const user = {
      uid: 'uid-1',
      email: payload.email,
      username: payload.username,
    };
    registerUserByAdmin.execute.mockResolvedValue({
      kind: 'invitation',
      user,
      invitationSent: true,
    });

    const result = await controller.register(payload);

    expect(registerUserByAdmin.execute).toHaveBeenCalledWith({
      email: payload.email,
      username: payload.username,
      roleCode: AppRoleCode.USER,
      locale: 'fr',
    });
    expect(result).toEqual({ user, invitationSent: true });
  });

  it('returns account setup link when register command yields fake user', async () => {
    const payload: JwtRegisterRequestDto = {
      email: 'fake@example.local',
      username: 'Fake User',
      locale: 'en',
      fakeUser: true,
      roleCode: AppRoleCode.HUNTER,
    };
    const user = {
      uid: 'uid-fake',
      email: payload.email,
      username: payload.username,
    };
    const link = 'https://app.test/en/password-reset?token=abc&flow=setup';
    registerUserByAdmin.execute.mockResolvedValue({
      kind: 'fakeUser',
      user,
      accountSetupLink: link,
    });

    const result = await controller.register(payload);

    expect(registerUserByAdmin.execute).toHaveBeenCalledWith({
      email: payload.email,
      username: payload.username,
      roleCode: AppRoleCode.HUNTER,
      locale: 'en',
      fakeUser: true,
    });
    expect(result).toEqual({
      user,
      invitationSent: false,
      fakeUser: true,
      accountSetupLink: link,
    });
  });

  it('returns JWT body when register command yields a session (legacy password path)', async () => {
    const payload: JwtRegisterRequestDto = {
      email: 'john@example.com',
      username: 'john',
    };
    const session = {
      token: FAKE_JWT,
      refreshToken: 'opaque-refresh',
      user: {
        uid: 'uid-1',
        email: payload.email,
        username: payload.username,
      },
      require2FA: false,
    };
    registerUserByAdmin.execute.mockResolvedValue({ kind: 'session', session });

    const result = await controller.register(payload);

    expect(result).toEqual({
      token: FAKE_JWT,
      user: session.user,
      require2FA: false,
    });
  });

  it('login attaches refresh cookie and returns access-only body', () => {
    const session: AuthenticatedSession = {
      token: FAKE_JWT,
      refreshToken: 'opaque-r2',
      user: { uid: 'uid-1', email: 'john@example.com', username: 'john' },
      require2FA: false,
    };
    const req = { user: session } as Request & { user: AuthenticatedSession };
    const res = { cookie: jest.fn() } as unknown as Response;

    const result = controller.login(req, res);

    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({
      token: FAKE_JWT,
      user: session.user,
      require2FA: false,
    });
  });

  it('does not call register command from controller login', () => {
    const payload: JwtLoginRequestDto = {
      email: 'john@example.com',
      password: 'password123',
    };
    const req = {
      body: payload,
      user: {
        token: FAKE_JWT,
        user: { uid: 'uid-1', email: 'john@example.com', username: 'john' },
      },
    } as Request & {
      user: unknown;
      body: JwtLoginRequestDto;
    };
    const res = { cookie: jest.fn() } as unknown as Response;

    controller.login(req as never, res);

    expect(registerUserByAdmin.execute).not.toHaveBeenCalled();
  });

  it('refresh reads cookie name, rotates via query, returns access-only JSON', async () => {
    const newSession = {
      token: 'new-access-token',
      refreshToken: 'new-refresh',
      user: {
        uid: 'uid-1',
        email: 'john@example.com',
        username: 'john',
      },
      require2FA: false,
    };
    refreshAccessToken.execute.mockResolvedValue(newSession);
    const req = {
      cookies: { [getJwtRefreshCookieName()]: ' old-refresh ' },
    } as unknown as Request;
    const res = { cookie: jest.fn() } as unknown as Response;

    const result = await controller.refresh(req, res);

    expect(refreshAccessToken.execute).toHaveBeenCalledWith('old-refresh');
    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({
      token: 'new-access-token',
      user: newSession.user,
      require2FA: false,
    });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('logout revokes refresh hash, clears cookies (all path variants), returns ok', async () => {
    logoutSession.execute.mockResolvedValue(undefined);
    const req = {
      cookies: { [getJwtRefreshCookieName()]: ' old-refresh-token ' },
    } as unknown as Request;
    const res = { clearCookie: jest.fn() } as unknown as Response;

    const result = await controller.logout(req, res);

    expect(logoutSession.execute).toHaveBeenCalledWith('old-refresh-token');
    expect(res.clearCookie).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it('logout without refresh cookie still clears cookies', async () => {
    logoutSession.execute.mockResolvedValue(undefined);
    const req = { cookies: {} } as unknown as Request;
    const res = { clearCookie: jest.fn() } as unknown as Response;

    await controller.logout(req, res);

    expect(logoutSession.execute).toHaveBeenCalledWith(undefined);
    expect(res.clearCookie).toHaveBeenCalled();
  });
});
