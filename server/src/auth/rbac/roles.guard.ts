import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Identity } from '../domain/models/identity';
import { ROLES_KEY } from './roles-metadata';
import type { AppRoleCode } from '../../shared/rbac/app-role.code';

/**
 * After JWT auth: requires `request.user.roleCode` to match one of `@Roles(...)` values.
 * Routes without `@Roles` metadata pass through.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const identity = request.user as Identity | undefined;

    if (!identity?.roleCode) {
      throw new ForbiddenException('Missing application role');
    }

    if (!required.includes(identity.roleCode)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
