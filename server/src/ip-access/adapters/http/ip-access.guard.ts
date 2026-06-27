import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { resolveClientIp } from '../../../shared/http/client-ip.util';
import { isPublicApiPath } from '../../../shared/http/public-api-path.util';
import { isIpAccessEnabled } from '../../../shared/is-ip-access-enabled';
import { EvaluateClientIpAccessQuery } from '../../application/queries/evaluate-client-ip-access.query';

function shouldSkipIpAccess(req: Request): boolean {
  if (!isIpAccessEnabled()) {
    return true;
  }
  return isPublicApiPath(req);
}

@Injectable()
export class IpAccessGuard implements CanActivate {
  constructor(
    private readonly evaluateClientIpAccess: EvaluateClientIpAccessQuery,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (shouldSkipIpAccess(req)) {
      return true;
    }

    const decision = await this.evaluateClientIpAccess.execute(
      resolveClientIp(req),
    );

    if (decision.code === 'ALLOW') {
      return true;
    }

    if (decision.code === 'DENY_BLACKLISTED') {
      throw new ForbiddenException('Client IP is blocked');
    }

    throw new ForbiddenException('Client IP is not allowed');
  }
}
