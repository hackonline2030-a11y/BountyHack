import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function ctxWithUser(roleCode: AppRoleCode | null | undefined) {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { uid: 'u1', email: 'a@b.co', roleCode } }),
      }),
    };
  }

  it('allows when no @Roles metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(
      guard.canActivate(ctxWithUser(undefined) as never),
    ).toBe(true);
  });

  it('allows when user role matches', () => {
    reflector.getAllAndOverride.mockReturnValue([
      AppRoleCode.SUPER_ADMIN,
      AppRoleCode.USER,
    ]);
    expect(
      guard.canActivate(
        ctxWithUser(AppRoleCode.SUPER_ADMIN) as never,
      ),
    ).toBe(true);
  });

  it('throws when role missing', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRoleCode.SUPER_ADMIN]);
    expect(() =>
      guard.canActivate(ctxWithUser(undefined) as never),
    ).toThrow(ForbiddenException);
  });

  it('throws when role not in required set', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRoleCode.SUPER_ADMIN]);
    expect(() =>
      guard.canActivate(ctxWithUser(AppRoleCode.HUNTER) as never),
    ).toThrow(ForbiddenException);
  });
});
