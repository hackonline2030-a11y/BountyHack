import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { PassportJwtAuthGuard } from '../adapters/passport-jwt/guards/passport-jwt-auth.guard';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles-metadata';

/** Marks required RBAC roles for the handler (logical OR — user matches any listed role). */
export const Roles = (...roles: AppRoleCode[]) => SetMetadata(ROLES_KEY, roles);

/** JWT Bearer + `@Roles(...)`. Prefer this over chaining `@Auth()` + manual guards when roles are needed. */
export function AuthRoles(...roles: AppRoleCode[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(PassportJwtAuthGuard, RolesGuard),
  );
}
